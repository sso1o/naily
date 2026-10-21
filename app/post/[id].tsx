import { TYPOGRAPHY } from '@/constants/typography';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import PostBlockRenderer from '@/components/PostBlockRenderer';
import RoleBadge from '@/components/RoleBadge';
import ScreenHeader from '@/components/ScreenHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { allPosts, comments, currentUser, users } from '@/data/mockData';
import type { Comment } from '@/types/models';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { addLocalComment } from '@/services/postInteractions';

const INK = '#241B1E';
const MUTED = '#7F7377';

type LocalComment = Comment & { parentId?: string };

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { likedIds, savedIds, toggleLike, toggleSave } = usePostInteractions();
  const liked = likedIds.has(id);
  const saved = savedIds.has(id);
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [localComments, setLocalComments] = useState<LocalComment[]>(() => comments.filter((comment) => comment.postId === id));
  const post = allPosts.find((item) => item.id === id);

  if (!post) return <SafeAreaView style={styles.safe}><ScreenHeader title="게시글" /><EmptyState title="게시글을 찾을 수 없어요" /></SafeAreaView>;
  const author = users.find((user) => user.id === post.authorId);
  const displayedCommentCount = post.commentCount;
  const orderedComments = localComments
    .filter((comment) => !comment.parentId)
    .flatMap((comment) => [comment, ...localComments.filter((reply) => reply.parentId === comment.id)]);
  const sharePost = () => Share.share({ message: `Naily 커뮤니티에서 “${post.title}” 글을 확인해보세요!` });
  const startReply = (comment: LocalComment) => {
    setReplyingTo({ id: comment.parentId ?? comment.id, name: comment.authorName });
    inputRef.current?.focus();
  };
  const submitComment = () => {
    const content = draft.trim();
    if (!content) return;
    addLocalComment({
      id: `local-${Date.now()}`,
      postId: post.id,
      authorId: currentUser.id,
      authorName: currentUser.nickname,
      content,
      createdAt: '방금 전',
      parentId: replyingTo?.id,
    });
    setLocalComments(comments.filter((comment) => comment.postId === post.id));
    setDraft('');
    setReplyingTo(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <RoundButton icon="chevron-back" label="뒤로 가기" onPress={() => router.back()} />
        <Text style={styles.topTitle}>{post.isShopOnly ? '샵 원장님 라운지' : '커뮤니티'}</Text>
        {post.authorId === currentUser.id ? <PrimaryButton label="수정" accessibilityLabel="게시글 수정" size="small" variant="secondary" onPress={() => router.push({ pathname: '/write', params: { editId: post.id, mode: post.isShopOnly ? 'shop' : 'public' } })} /> : <View style={styles.topSpacer} />}
      </View>

      <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.authorRow}>
            {author?.avatarUrl ? <Image source={{ uri: author.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{post.authorName[0]}</Text></View>}
            <View style={styles.authorText}>
              <View style={styles.authorNameRow}><Text style={styles.authorName}>{post.authorName}</Text>{post.authorRole !== 'general' ? <RoleBadge role={post.authorRole} verified={author?.isShopVerified} /> : null}</View>
              <Text style={styles.date}>{post.createdAt}</Text>
            </View>
          </View>
        </View>

        {post.isShopOnly ? (
          <View style={styles.privateBadge}><Ionicons name="lock-closed" size={12} color="#7C695D" /><Text style={styles.privateText}>인증된 샵 사용자 전용 게시글</Text></View>
        ) : null}

        <View style={styles.headingSection}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{post.category}</Text>
          </View>
          <Text style={styles.title}>{post.title}</Text>
        </View>

        <View style={styles.article}>
          <PostBlockRenderer blocks={post.blocks} />
        </View>

        <View style={styles.tags}>
          {post.tags.map((tag) => <Text key={tag} style={styles.tagText}>#{tag.replace(/^#/, '')}</Text>)}
        </View>

        <View style={styles.socialCard}>
          <SocialButton icon={liked ? 'heart' : 'heart-outline'} label="좋아요" count={post.likeCount + (liked ? 1 : 0)} active={liked} onPress={() => toggleLike(post.id)} />
          <View style={styles.socialDivider} />
          <SocialButton icon={saved ? 'bookmark' : 'bookmark-outline'} label="저장" active={saved} onPress={() => toggleSave(post.id)} />
          <View style={styles.socialDivider} />
          <SocialButton icon="share-social-outline" label="공유" onPress={sharePost} />
        </View>

        <View style={styles.commentSection}>
          <View style={styles.commentHeader}><Text style={styles.commentTitle}>댓글</Text><Text style={styles.commentCount}>{displayedCommentCount}</Text></View>
          <View style={styles.commentList}>
            {orderedComments.length ? orderedComments.map((comment) => (
              <View key={comment.id} style={[styles.comment, comment.parentId && styles.nestedComment]}>
                <View style={styles.commentAvatar}><Text style={styles.commentAvatarText}>{comment.authorName[0]}</Text></View>
                <View style={styles.commentBody}>
                  <View style={styles.commentMeta}><Text style={styles.commentName}>{comment.authorName}</Text><Text style={styles.commentDate}>{comment.createdAt}</Text></View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <Pressable accessibilityLabel={`${comment.authorName}님에게 답글 달기`} hitSlop={8} onPress={() => startReply(comment)}><Text style={styles.reply}>답글 달기</Text></Pressable>
                </View>
              </View>
            )) : <View style={styles.emptyComment}><Ionicons name="chatbubble-ellipses-outline" size={26} color="#C7BFC2" /><Text style={styles.noComment}>첫 번째 댓글을 남겨보세요.</Text></View>}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {replyingTo ? <View style={styles.replyingBar}><Text style={styles.replyingText}>{replyingTo.name}님에게 답글 작성 중</Text><Pressable accessibilityLabel="답글 취소" hitSlop={8} onPress={() => setReplyingTo(null)}><Ionicons name="close" size={17} color={MUTED} /></Pressable></View> : null}
        <View style={styles.composerRow}>
          <View style={styles.commentInput}>
            <Ionicons name="chatbubble-outline" size={19} color="#A99FA2" />
            <TextInput ref={inputRef} value={draft} onChangeText={setDraft} onSubmitEditing={submitComment} returnKeyType="send" placeholder={replyingTo ? '답글을 남겨보세요' : '따뜻한 댓글을 남겨보세요'} placeholderTextColor="#A99FA2" style={styles.commentTextInput} />
          </View>
          <Pressable accessibilityLabel={replyingTo ? '답글 등록' : '댓글 등록'} disabled={!draft.trim()} onPress={submitComment} style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}><Ionicons name="arrow-up" size={20} color="#FFFFFF" /></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RoundButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} onPress={onPress} style={styles.roundButton}><Ionicons name={icon} size={21} color={INK} /></Pressable>;
}

function SocialButton({ icon, label, count, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; count?: number; active?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.socialButton}><Ionicons name={icon} size={21} color={active ? COLORS.primary : MUTED} /><Text style={[styles.socialLabel, active && styles.socialLabelActive]}>{label}{count !== undefined ? ` ${count}` : ''}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  topTitle: { ...TYPOGRAPHY.titleSmall, flex: 1, color: INK, textAlign: 'center' },
  topSpacer: { width: 40, height: 40 },
  editButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editText: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F5F6', alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 30, backgroundColor: '#FFFFFF' },
  profileSection: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#F2EDEF' },
  privateBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, marginHorizontal: 18, marginTop: 18, borderRadius: RADIUS.pill, backgroundColor: '#F1E9E3' },
  privateText: { ...TYPOGRAPHY.caption, color: '#7C695D' },
  headingSection: { paddingHorizontal: 18, paddingTop: 30, paddingBottom: 8 },
  categoryRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 2 },
  category: { ...TYPOGRAPHY.labelMedium, color: '#A6697A' },
  title: { ...TYPOGRAPHY.titleLarge, color: INK, marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 7, paddingHorizontal: 18, marginTop: 25 },
  tagText: { ...TYPOGRAPHY.labelMedium, color: '#8D747B', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 5, backgroundColor: '#F7F4F5' },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  avatarFallback: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.lightPink, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary },
  authorText: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  authorName: { ...TYPOGRAPHY.labelMedium, color: INK, flexShrink: 1 },
  date: { ...TYPOGRAPHY.caption, color: MUTED },
  article: { paddingHorizontal: SPACING.md, paddingTop: 12, paddingBottom: 8 },
  socialCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, marginTop: 24, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, borderColor: '#EDE7E9', backgroundColor: '#FFFFFF' },
  socialButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  socialLabel: { ...TYPOGRAPHY.caption, color: MUTED },
  socialLabelActive: { color: COLORS.primary },
  socialDivider: { width: 1, height: 25, backgroundColor: '#EEE8EA' },
  commentSection: { marginTop: 34, paddingTop: 25, paddingHorizontal: SPACING.md, borderTopWidth: 8, borderTopColor: '#F8F5F6' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentTitle: { ...TYPOGRAPHY.titleMedium, color: INK },
  commentCount: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary },
  commentList: { gap: 22, marginTop: 20 },
  comment: { flexDirection: 'row' },
  nestedComment: { marginLeft: 46, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#F0E7EA' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightPink, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  commentAvatarText: { ...TYPOGRAPHY.labelMedium, color: COLORS.primary },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  commentName: { ...TYPOGRAPHY.labelMedium, color: INK },
  commentDate: { ...TYPOGRAPHY.caption, color: '#AAA1A4' },
  commentContent: { ...TYPOGRAPHY.bodyMedium, color: '#40383B', marginTop: 7 },
  reply: { ...TYPOGRAPHY.labelMedium, color: MUTED, marginTop: 8 },
  emptyComment: { alignItems: 'center', paddingVertical: 28 },
  noComment: { ...TYPOGRAPHY.bodySmall, color: MUTED, marginTop: 8 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0EAEC', backgroundColor: '#FFFFFF', shadowColor: '#2B1B20', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 7 },
  replyingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 7 },
  replyingText: { ...TYPOGRAPHY.caption, color: MUTED, flex: 1 },
  composerRow: { flexDirection: 'row', gap: 9 },
  commentInput: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 15, borderRadius: 17, backgroundColor: '#F7F4F5' },
  commentTextInput: { ...TYPOGRAPHY.bodyMedium, flex: 1, color: INK, paddingVertical: 0 },
  sendButton: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  sendButtonDisabled: { backgroundColor: '#DDD5D8' },
});
