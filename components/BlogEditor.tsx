import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TYPOGRAPHY } from '@/constants/typography';
import { COLORS } from '@/constants/colors';
import { PostBlock } from '@/types/models';
import PrimaryButton from './PrimaryButton';
import EditorToolbar from './EditorToolbar';
import WritingSheet from './WritingSheet';
import RichWritingInput, { RichCommand, RichInputHandle, RichInputState } from './RichWritingInput';
import PostExtraBlock from './PostExtraBlock';
import PostBlockForm from './PostBlockForm';
import { insertPostBlock } from '@/services/postBlocks';
import { usePhotoReorder } from '@/hooks/usePhotoReorder';
import ResizablePostImage from './ResizablePostImage';

export type BlogEditorHandle = { focusBody: () => void };
type Props = {
  blocks: PostBlock[];
  onChange: Dispatch<SetStateAction<PostBlock[]>>;
  onEditImage: (block: PostBlock, insert?: boolean, anchor?: { id: string; offset?: number }) => void;
  header: ReactNode;
  footer: ReactNode;
  disabled?: boolean;
};

const BlogEditor = forwardRef<BlogEditorHandle, Props>(function BlogEditor({ blocks, onChange, onEditImage, header, footer, disabled }, ref) {
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [form, setForm] = useState<{ type: 'place' | 'poll'; block?: PostBlock } | null>(null);
  const insertionAnchor = useRef<{ id: string; offset?: number } | undefined>(undefined);
  const [menu, setMenu] = useState<'more' | null>(null);
  const nativeMenuOpen = useRef(false);
  const [picking, setPicking] = useState(false);
  const pickingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const inputRefs = useRef(new Map<string, RichInputHandle>());
  const pendingFocus = useRef<string | null>(null);
  const pendingDecoration = useRef<PostBlock | null>(null);
  const reorder = usePhotoReorder(blocks, onChange, Boolean(disabled || picking), (id, x, y) => inputRefs.current.get(id)?.locate(x, y) ?? Promise.resolve(null));
  const { scroll } = reorder;
  const sequence = useRef(0);
  const [activeFormat, setActiveFormat] = useState<Partial<RichInputState>>({ bold: false, size: 15, align: 'left' });
  const caret = useRef<{ id: string; bottom: number } | null>(null);
  const selected = blocks.find((block) => block.id === selectedId);
  const selectedIndex = blocks.findIndex((block) => block.id === selectedId);
  const textSelected = selected?.type === 'text' || selected?.type === 'heading';
  const newId = () => `block-${Date.now()}-${++sequence.current}`;
  const revealCaret = () => requestAnimationFrame(() => {
    const current = caret.current;
    const layout = current && reorder.layouts.current.get(current.id);
    if (!current || !layout) return;
    const metrics = reorder.metrics.current;
    const bottom = metrics.blocksTop + layout.y + current.bottom;
    const visibleBottom = metrics.offset + metrics.height - 16;
    if (bottom > visibleBottom) scroll.current?.scrollTo({ y: bottom - metrics.height + 24, animated: false });
    else if (bottom < metrics.offset + 24) scroll.current?.scrollTo({ y: Math.max(0, bottom - 40), animated: false });
  });
  const receiveState = (block: PostBlock, state: RichInputState) => {
    if (state.change) patchBlock(block.id, { content: state.content, runs: state.runs, align: state.align });
    if (state.focused) {
      setSelectedId(block.id); setActiveFormat(state);
      insertionAnchor.current = { id: block.id, offset: state.offset };
      if (state.caret) { caret.current = { id: block.id, bottom: state.caret.bottom }; revealCaret(); }
    } else if (caret.current?.id === block.id) caret.current = null;
  };
  const patchBlock = (id: string, patch: Partial<PostBlock>) => onChange((current) => current.map((block) => block.id === id ? { ...block, ...patch } : block));
  const focus = (id: string) => {
    setSelectedId(id);
    const input = inputRefs.current.get(id);
    if (input && !nativeMenuOpen.current) input.focus(); else pendingFocus.current = id;
  };
  const addText = (type: 'text' | 'heading') => {
    const id = newId();
    onChange((current) => [...current, { id, type, content: '', ...(type === 'heading' ? { fontSize: 20, bold: true } : {}), align: 'left' }]);
    focus(id);
  };
  useImperativeHandle(ref, () => ({ focusBody() {
    const first = blocks.find((block) => block.type === 'text' || block.type === 'heading');
    if (first) focus(first.id); else addText('text');
  } }));

  const pickImage = async (existingId?: string) => {
    if (pickingRef.current || disabled) return;
    pickingRef.current = true;
    setPicking(true);
    Keyboard.dismiss();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mounted.current) return;
      if (!permission.granted) {
        Alert.alert('사진 접근 권한이 필요해요', '게시글에 사진을 추가하려면 사진 보관함 접근을 허용해주세요.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.9 });
      if (result.canceled || !result.assets[0] || !mounted.current) return;
      const asset = result.assets[0];
      const decoratedImage = { uri: asset.uri, aspectRatio: asset.width && asset.height ? asset.width / asset.height : 4 / 5, decorations: [] };
      const id = existingId ?? newId();
      // Keep the picked photo outside the document until the editor completes.
      onEditImage({ id, type: 'image', imageUrl: asset.uri, decoratedImage }, !existingId, insertionAnchor.current);
    } catch {
      Alert.alert('사진을 열 수 없어요', '잠시 후 다시 시도해주세요.');
    } finally {
      pickingRef.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const format = (kind: RichCommand, value?: number | string) => {
    if (!selected || !textSelected) return;
    inputRefs.current.get(selected.id)?.command(kind, value);
  };
  const insert = (block: PostBlock) => {
    const anchor = insertionAnchor.current;
    onChange(current => insertPostBlock(current, block, anchor));
    insertionAnchor.current = { id: `${block.id}-tail`, offset: 0 };
    focus(`${block.id}-tail`);
  };
  const pickVideo = async () => {
    if (disabled || pickingRef.current) return;
    pickingRef.current = true; setPicking(true); Keyboard.dismiss();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!mounted.current) return;
      if (!permission.granted) { Alert.alert('동영상 접근 권한이 필요해요'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false });
      if (!mounted.current || result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      insert({ id: newId(), type: 'video', video: { uri: asset.uri, aspectRatio: asset.width && asset.height ? asset.width / asset.height : 16 / 9 } });
    } catch { Alert.alert('동영상을 열 수 없어요', '다시 시도해주세요.'); }
    finally { pickingRef.current = false; if (mounted.current) setPicking(false); }
  };
  const move = (direction: -1 | 1) => onChange((current) => {
    const index = current.findIndex((block) => block.id === selectedId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= current.length) return current;
    const reordered = [...current];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    return reordered;
  });
  const remove = (id: string) => {
    onChange((current) => {
      const remaining = current.filter((block) => block.id !== id);
      return remaining.length ? remaining : [{ id: 'draft-text', type: 'text', content: '' }];
    });
    setSelectedId(null);
    setMenu(null);
  };
  const openMenu = (next: 'more') => { Keyboard.dismiss(); nativeMenuOpen.current = Platform.OS === 'ios'; setMenu(next); };

  return <View style={styles.container}>
    <View style={styles.toolbar}>
      <EditorToolbar images={blocks.filter(block => block.type === 'image').map(block => block.decoratedImage?.uri ?? block.imageUrl ?? '').filter(Boolean)} disabled={disabled || picking || Boolean(reorder.drag)} hasSelection={textSelected} format={activeFormat} onFormat={format} onPhoto={() => pickImage()} onVideo={pickVideo} onDivider={() => insert({ id: newId(), type: 'divider' })} onPlace={() => setForm({ type: 'place' })} onPoll={() => setForm({ type: 'poll' })} />
    </View>
    <View ref={reorder.viewport} style={styles.container} onLayout={() => { reorder.measure(); revealCaret(); }} {...reorder.panHandlers}>
    <ScrollView ref={scroll} scrollEnabled={!reorder.drag} onScroll={({ nativeEvent }) => { reorder.metrics.current.offset = nativeEvent.contentOffset.y; }} scrollEventThrottle={16} onContentSizeChange={(_w, h) => { reorder.metrics.current.content = h; }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets={false} contentContainerStyle={styles.document}>
      <View pointerEvents={reorder.drag ? 'none' : 'auto'}>{header}</View>
      <View style={styles.blocks} onLayout={({ nativeEvent }) => { reorder.metrics.current.blocksTop = nativeEvent.layout.y; }}>
        {blocks.map((block) => <View key={block.id} onLayout={({ nativeEvent }) => { reorder.layouts.current.set(block.id, nativeEvent.layout); if (caret.current?.id === block.id) revealCaret(); }} style={[styles.block, reorder.drag?.id === block.id && { zIndex: 2 }]}>
          {reorder.drag?.before === block.id && !reorder.drag.drop && <View pointerEvents="none" style={styles.insertion} />}
          {reorder.drag?.drop?.id === block.id && <View pointerEvents="none" style={{ position: 'absolute', zIndex: 3, width: 2, backgroundColor: COLORS.primary, top: reorder.drag.drop.top, left: reorder.drag.drop.left ?? 0, height: Math.max(18, reorder.drag.drop.height ?? 22) }} />}
          {(block.type === 'text' || block.type === 'heading') && <RichWritingInput
            ref={(input) => {
              if (input) { inputRefs.current.set(block.id, input); if (pendingFocus.current === block.id && !nativeMenuOpen.current) { pendingFocus.current = null; input.focus(); } }
              else inputRefs.current.delete(block.id);
            }}
            block={block} disabled={disabled || Boolean(reorder.drag)} onState={(state) => receiveState(block, state)}
          />}
          {block.type === 'image' && <View style={reorder.drag?.id === block.id ? { opacity: 0.8, transform: [{ translateY: reorder.drag.dy }, { scale: 0.96 }] } : undefined}>
            <ResizablePostImage block={block} selected={selectedId === block.id} disabled={disabled || Boolean(reorder.drag)} dragProps={reorder.handleProps(block.id)} onChange={widthRatio => patchBlock(block.id, { widthRatio })} onSelect={() => { Keyboard.dismiss(); caret.current = null; setSelectedId(block.id); insertionAnchor.current = { id: block.id }; }} />
            <View accessible accessibilityRole="button" accessibilityLabel="사진 이동 핸들, 길게 누른 뒤 위아래로 이동" accessibilityHint="활성화하면 위로 이동, 아래로 이동 메뉴를 열어요" accessibilityActions={[{ name: 'activate', label: '순서 메뉴 열기' }]} onAccessibilityAction={() => { setSelectedId(block.id); openMenu('more'); }} style={styles.dragHandle} {...reorder.handleProps(block.id)}><Ionicons name="reorder-two" size={22} color={COLORS.text} /></View>
            {selectedId === block.id && <View pointerEvents={reorder.drag ? 'none' : 'auto'} style={styles.imageActions}>
              <Pressable accessibilityLabel="사진 삭제" hitSlop={6} disabled={disabled} onPress={() => remove(block.id)} style={styles.imageDelete}><Ionicons name="close" size={20} color={COLORS.text} /></Pressable>
              <Pressable disabled={disabled || picking} onPress={() => pickImage(block.id)} style={styles.action}><Text style={styles.actionText}>변경</Text></Pressable>
              {(block.decoratedImage || block.imageUrl) && <PrimaryButton label="사진 편집" variant="secondary" size="small" disabled={disabled} onPress={() => onEditImage(block)} />}
              <Pressable disabled={disabled} onPress={() => openMenu('more')} style={styles.action}><Text style={styles.actionText}>순서·삭제</Text></Pressable>
            </View>}
          </View>}
          {block.type === 'divider' && <Pressable accessibilityLabel="구분선 선택" disabled={disabled} onPress={() => { setSelectedId(block.id); insertionAnchor.current = { id: block.id }; openMenu('more'); }} style={styles.dividerTouch}><View style={styles.divider} /></Pressable>}
          {['video', 'place', 'poll'].includes(block.type) && <View>
            <PostExtraBlock block={block} />
            <View style={styles.imageActions}>
              {(block.type === 'place' || block.type === 'poll') && <PrimaryButton label="편집" variant="secondary" size="small" disabled={disabled} onPress={() => setForm({ type: block.type as 'place' | 'poll', block })} />}
              <Pressable disabled={disabled} onPress={() => { setSelectedId(block.id); insertionAnchor.current = { id: block.id }; openMenu('more'); }} style={styles.action}><Text style={styles.actionText}>순서·삭제</Text></Pressable>
            </View>
          </View>}
        </View>)}
        {reorder.drag && reorder.drag.before === null && !reorder.drag.drop && <View pointerEvents="none" style={[styles.insertion, { top: undefined, bottom: -10 }]} />}
      </View>
      <View pointerEvents={reorder.drag ? 'none' : 'auto'}>{footer}</View>
    </ScrollView>
    </View>
    {form && <PostBlockForm key={form.block?.id ?? form.type} type={form.type} block={form.block} onClose={() => setForm(null)} onSave={patch => { if (form.block) patchBlock(form.block.id, patch); else insert({ id: newId(), type: form.type, ...patch }); setForm(null); }} />}
    <WritingSheet visible={menu !== null} title="편집 도구" onClose={() => setMenu(null)} onDismiss={() => {
      nativeMenuOpen.current = false;
      if (pendingDecoration.current) { const block = pendingDecoration.current; pendingDecoration.current = null; onEditImage(block); }
      if (pendingFocus.current) { inputRefs.current.get(pendingFocus.current)?.focus(); pendingFocus.current = null; }
    }}>
        <Pressable onPress={() => { setMenu(null); void pickImage(); }} style={styles.menuAction}><Text style={styles.actionText}>사진 추가</Text></Pressable>
        {selected && !['text', 'heading'].includes(selected.type) && <>
          <Text style={styles.meta}>선택한 블록</Text>
          <Pressable disabled={selectedIndex <= 0} onPress={() => move(-1)} style={[styles.menuAction, selectedIndex <= 0 && styles.disabled]}><Text style={styles.actionText}>위로 이동</Text></Pressable>
          <Pressable disabled={selectedIndex >= blocks.length - 1} onPress={() => move(1)} style={[styles.menuAction, selectedIndex >= blocks.length - 1 && styles.disabled]}><Text style={styles.actionText}>아래로 이동</Text></Pressable>
          {selected.type === 'image' && <Pressable onPress={() => { setMenu(null); if (Platform.OS === 'ios') pendingDecoration.current = selected; else onEditImage(selected); }} style={styles.menuAction}><Text style={styles.actionText}>꾸미기</Text></Pressable>}
          <Pressable onPress={() => remove(selected.id)} style={styles.menuAction}><Text style={[styles.actionText, styles.danger]}>삭제</Text></Pressable>
        </>}
    </WritingSheet>
  </View>;
});
export default BlogEditor;
const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { backgroundColor: COLORS.card, zIndex: 3 },
  document: { paddingHorizontal: 20, paddingBottom: 32 },
  blocks: { gap: 20, paddingTop: 12 },
  block: { width: '100%' },
  insertion: { position: 'absolute', top: -10, left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: COLORS.primary },
  dragHandle: { position: 'absolute', top: 8, right: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  textInput: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text, padding: 0, textAlignVertical: 'top', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', overflow: 'hidden' } as object) : {}) },
  image: { width: '100%', borderRadius: 8, backgroundColor: COLORS.lightPink },
  imageActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', paddingTop: 4 },
  imageDelete: { position: 'absolute', top: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -52 }] },
  action: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  actionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  dividerTouch: { minHeight: 44, paddingVertical: 8, justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  menuAction: { minHeight: 48, paddingVertical: 12, justifyContent: 'center' },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.subText, paddingTop: 12, paddingBottom: 4 },
  danger: { color: COLORS.danger },
  disabled: { opacity: 0.35 },
});
