import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BlogEditor, { BlogEditorHandle } from '@/components/BlogEditor';
import PostBlockRenderer from '@/components/PostBlockRenderer';
import WritingSheet from '@/components/WritingSheet';
import WritingTextInput from '@/components/WritingTextInput';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import { takeImageDecorationDraft, setImageDecorationDraft } from '@/data/imageDecorationDrafts';
import { allPosts, currentUser, prepareMedia } from '@/data/mockData';
import { DecoratedPostImage, PostBlock } from '@/types/models';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { insertPostBlock } from '@/services/postBlocks';
import { initialPostBlocks, MAGAZINE_CATEGORIES, parsePostTags, PUBLIC_CATEGORIES, savePostDraft, SHOP_CATEGORIES, writingMode, WritingMode } from '@/services/postDraft';

export default function WriteScreen() {
  const { mode: requestedMode = 'public', editId } = useLocalSearchParams<{ mode?: WritingMode; editId?: string }>();
  const router = useRouter();
  const existingPost = editId ? allPosts.find((item) => item.id === editId) : undefined;
  const mode = writingMode(requestedMode, existingPost);
  const categories = mode === 'shop' ? SHOP_CATEGORIES : mode === 'magazine' ? MAGAZINE_CATEGORIES : PUBLIC_CATEGORIES;
  const [title, setTitle] = useState(existingPost?.title ?? '');
  const [category, setCategory] = useState(existingPost?.category ?? categories[0]);
  const [tagText, setTagText] = useState(existingPost?.tags.map((tag) => `#${tag}`).join(' ') ?? '');
  const [blocks, setBlocks] = useState<PostBlock[]>(() => initialPostBlocks(existingPost));
  const [preview, setPreview] = useState(false);
  const [sheet, setSheet] = useState<'category' | null>(null);
  const [actionsWidth, setActionsWidth] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const editor = useRef<BlogEditorHandle>(null);
  const decorationDraftKeys = useRef(new Map<string, string>());
  const decorationDraftSources = useRef(new Map<string, DecoratedPostImage>());
  const pendingInsertIds = useRef(new Set<string>());
  const pendingInsertAnchors = useRef(new Map<string, { id: string; offset?: number } | undefined>());
  const draftSnapshot = JSON.stringify({ title, category, tagText, blocks });
  const initialSnapshot = useRef(draftSnapshot);
  const allowSavedExit = useUnsavedChanges(draftSnapshot !== initialSnapshot.current);
  const tags = parsePostTags(tagText);
  const canSubmit = Boolean(title.trim()) && !submitting;

  useFocusEffect(useCallback(() => {
    if (!decorationDraftKeys.current.size) return;
    const updates = new Map([...decorationDraftKeys.current].map(([id, key]) => {
      const image = takeImageDecorationDraft(key);
      return [id, image === decorationDraftSources.current.get(id) ? undefined : image];
    }));
    const inserts = new Set(pendingInsertIds.current); pendingInsertIds.current.clear();
    decorationDraftKeys.current.clear();
    decorationDraftSources.current.clear();
    setBlocks((current) => {
      let next = current.map((block) => {
        const image = updates.get(block.id);
        return image ? { ...block, imageUrl: image.uri, decoratedImage: image } : block;
      });
      for (const id of inserts) {
        const image = updates.get(id);
        if (image && !next.some(block => block.id === id)) next = insertPostBlock(next, { id, type: 'image', imageUrl: image.uri, decoratedImage: image }, pendingInsertAnchors.current.get(id));
      }
      pendingInsertAnchors.current.clear();
      return next;
    });
  }, []));

  const editImage = (block: PostBlock, insert = false, anchor?: { id: string; offset?: number }) => {
    const source = block.decoratedImage ?? (block.imageUrl ? { uri: block.imageUrl, aspectRatio: 4 / 3, decorations: [] } : undefined);
    if (!source) return;
    Keyboard.dismiss();
    const draftKey = `write-${block.id}`;
    decorationDraftKeys.current.set(block.id, draftKey);
    decorationDraftSources.current.set(block.id, source);
    if (insert) pendingInsertIds.current.add(block.id);
    if (insert) pendingInsertAnchors.current.set(block.id, anchor);
    setImageDecorationDraft(draftKey, source);
    router.push({ pathname: '/image-decorator', params: { draftKey } });
  };
  const openSheet = (value: 'category') => { Keyboard.dismiss(); setSheet(value); };
  const closeSheet = () => { Keyboard.dismiss(); setSheet(null); };
  const openPreview = () => {
    Keyboard.dismiss(); setPreview(true);
  };
  const submit = async () => {
    if (submittingRef.current) return;
    if (!title.trim()) { Alert.alert('제목을 입력해주세요', '독자가 내용을 쉽게 찾을 수 있도록 제목을 적어주세요.'); return; }
    submittingRef.current = true;
    setSubmitting(true);
    Keyboard.dismiss();
    try {
      // Give the disabled state/spinner a frame before the local synchronous write.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const durableBlocks = prepareMedia ? await prepareMedia(blocks) : blocks;
      const post = savePostDraft({ title, category, tagText, blocks: durableBlocks, mode, existing: existingPost });
      if (Platform.OS !== 'web') {
        await new Promise<void>((resolve) => Alert.alert(existingPost ? '글을 수정했어요' : '글이 등록되었어요', '이 기기에 글을 저장했어요.', [{ text: '확인', onPress: () => resolve() }], { cancelable: false }));
      }
      allowSavedExit();
      router.replace(`/post/${post.id}`);
      // Keep the synchronous lock until unmount, preventing a second save during navigation.
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
      Alert.alert('저장하지 못했어요', '작성한 내용은 유지됩니다. 다시 시도해주세요.');
    }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.appBar}>
        <Pressable accessibilityLabel="작성 취소" disabled={submitting} onPress={() => router.back()} style={[styles.iconButton, styles.closeButton]}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
        <View pointerEvents="none" style={[styles.titleLayer, { left: actionsWidth + 16, right: actionsWidth + 16 }]}><Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit style={styles.appTitle}>글쓰기</Text></View>
        <View onLayout={({ nativeEvent }) => setActionsWidth(nativeEvent.layout.width)} style={styles.headerActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="미리보기" disabled={submitting} onPress={openPreview} style={styles.previewButton}><Text style={styles.previewText}>미리보기</Text></Pressable>
        <PrimaryButton label={existingPost ? '완료' : '등록'} accessibilityLabel={existingPost ? '수정 완료' : '등록'} size="small" disabled={!canSubmit} busy={submitting} onPress={submit} />
        </View>
      </View>
      <BlogEditor ref={editor} blocks={blocks} onChange={setBlocks} onEditImage={editImage} disabled={submitting}
        header={<>
          <Pressable accessibilityLabel="게시판 선택" disabled={submitting} onPress={() => openSheet('category')} style={styles.category}>
            <Text style={styles.categoryText}>{mode === 'shop' ? '샵 라운지 · ' : mode === 'magazine' ? '매거진 · ' : ''}{category}</Text><Ionicons name="chevron-down" size={16} color={COLORS.subText} />
          </Pressable>
          {mode === 'shop' && <Text style={styles.account}>{existingPost?.authorName ?? currentUser.nickname} · 샵 전용 게시글</Text>}
          <WritingTextInput accessibilityLabel="글 제목" value={title} onChangeText={setTitle} editable={!submitting} placeholder="제목을 입력하세요" placeholderTextColor="#A8A1A3" style={styles.titleInput} returnKeyType="next" blurOnSubmit={Platform.OS === 'web' ? true : undefined} submitBehavior="submit" onSubmitEditing={() => editor.current?.focusBody()} />
        </>}
        footer={<View style={{ paddingTop: 16 }}>
          <WritingTextInput accessibilityLabel="태그 입력" value={tagText} onChangeText={setTagText} editable={!submitting} placeholder="#태그입력 (공백으로 구분)" placeholderTextColor="#A8A1A3" style={styles.tagInput} />
        </View>}
      />
    </KeyboardAvoidingView>
    <WritingSheet visible={sheet !== null} title="게시판 선택" onClose={closeSheet}>
      {categories.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: category === item }} onPress={() => { setCategory(item); closeSheet(); }} style={styles.option}>
        <Text style={styles.optionText}>{item}</Text>{category === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
      </Pressable>)}
    </WritingSheet>
    <Modal visible={preview} animationType="slide" onRequestClose={() => setPreview(false)}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.appBar}>
          <Pressable accessibilityLabel="미리보기 닫기" onPress={() => setPreview(false)} style={styles.iconButton}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></Pressable>
          <View pointerEvents="none" style={[styles.titleLayer, { left: 68, right: 68 }]}><Text style={styles.appTitle}>미리보기</Text></View>
          <PrimaryButton style={{ marginLeft: 'auto' }} label="편집" size="small" variant="secondary" onPress={() => setPreview(false)} />
        </View>
        <ScrollView contentContainerStyle={styles.previewContent}>
          <Text style={styles.previewCategory}>{category}</Text>
          <Text style={styles.previewTitle}>{title || '제목을 입력하세요'}</Text>
          <PostBlockRenderer blocks={blocks} interactive={false} />
          <View style={styles.previewTags}>{tags.map((tag, index) => <Text key={`${tag}-${index}`} style={styles.tagText}>#{tag}</Text>)}</View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card },
  fill: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  titleLayer: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', gap: 4, alignItems: 'center' },
  appTitle: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, flexShrink: 1, minWidth: 0, textAlign: 'center' },
  closeButton: { width: 44, alignItems: 'flex-start', paddingLeft: 10 },
  previewButton: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
  previewText: { ...TYPOGRAPHY.labelMedium, color: COLORS.text },
  submit: { minHeight: 44, minWidth: 44, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },
  submitVisual: { height: 32, minWidth: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  submitText: { ...TYPOGRAPHY.labelMedium, color: '#FFFFFF' },
  disabled: { opacity: 0.35 },
  category: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  categoryText: { ...TYPOGRAPHY.labelLarge, color: COLORS.subText, flexShrink: 1 },
  account: { ...TYPOGRAPHY.caption, color: COLORS.subText, paddingBottom: 8 },
  titleInput: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, paddingVertical: 6, paddingHorizontal: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', overflow: 'hidden' } as object) : {}) },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 20 },
  tagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%', backgroundColor: COLORS.background, borderRadius: 12, paddingLeft: 10 },
  tagText: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText, flexShrink: 1 },
  tagRemove: { minWidth: 32, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  tagAdd: { minHeight: 40, justifyContent: 'center' },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  optionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, flexShrink: 1 },
  tagInput: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text, paddingVertical: 6, textAlignVertical: 'top', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.subText, paddingVertical: 8 },
  previewContent: { padding: 20, paddingBottom: 40 },
  previewCategory: { ...TYPOGRAPHY.labelMedium, color: COLORS.primary, marginBottom: 12 },
  previewTitle: { ...TYPOGRAPHY.titleLarge, color: COLORS.text, marginBottom: 24 },
  previewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
});
