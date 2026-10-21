import { TYPOGRAPHY } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { CommunityPost } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';
import { users } from '@/data/mockData';
import DecoratedImage from './DecoratedImage';

type Props = {
  post: CommunityPost;
  onPress?: () => void;
  featured?: boolean;
  onOpen?: (postId: string) => void;
  liked?: boolean;
  saved?: boolean;
  onToggleLike?: (postId: string) => void;
  onToggleSave?: (postId: string) => void;
};

function BlogPostCard({ post, onPress, onOpen, featured = false, liked: controlledLiked, saved: controlledSaved, onToggleLike, onToggleSave }: Props) {
  const [localLiked, setLiked] = useState(false);
  const [localSaved, setSaved] = useState(false);
  const liked = controlledLiked ?? localLiked;
  const saved = controlledSaved ?? localSaved;
  const palette = getPostPalette(post.category);
  const author = users.find((user) => user.id === post.authorId);
  const media = useMemo(() => post.decoratedImage ?? (post.imageUrl
    ? { uri: post.imageUrl, aspectRatio: featured ? 4 / 3 : 1, decorations: [] }
    : undefined), [post.decoratedImage, post.imageUrl, featured]);
  const sharePost = () => Share.share({ message: `Naily 커뮤니티에서 “${post.title}” 글을 확인해보세요!` });

  if (featured) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onOpen ? () => onOpen(post.id) : onPress}
        style={({ pressed }) => [styles.socialPost, pressed && styles.socialPressed]}
      >
        <View style={styles.socialHeader}>
          {author?.avatarUrl ? (
            <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{post.authorName.slice(0, 1)}</Text>
            </View>
          )}
          <View style={styles.authorBlock}>
            <View style={styles.authorLine}>
              <Text style={styles.author}>{post.authorName}</Text>
              {post.authorRole === 'shop_owner' ? <Ionicons name="storefront" size={13} color="#B66F84" /> : null}
            </View>
            <Text style={styles.date}>{post.createdAt.slice(5).replace('.', '/')}</Text>
          </View>
          <View style={[styles.categoryPill, { backgroundColor: palette.soft }]}>
            <Text style={[styles.category, { color: palette.ink }]}>{post.category}</Text>
          </View>
        </View>

        {media ? <DecoratedImage image={media} fallbackLabel="POST" style={styles.socialImage} /> : null}

        <View style={[styles.socialBody, !media && styles.textOnlyBody]}>
          <Text style={styles.socialTitle}>{post.title}</Text>
          <Text style={styles.socialPreview} numberOfLines={3}>{post.preview}</Text>
          <View style={styles.readMoreRow}>
            <Text style={styles.readMore}>본문 이어보기</Text>
            <Ionicons name="arrow-forward" size={14} color="#8E5365" />
          </View>
          {post.tags.length ? (
            <View style={styles.nailTags}>
              {post.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.nailTag}>
                  <Text style={styles.nailTagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.engagementRow}>
            <View style={styles.engagementStats}>
              <Pressable
                accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
                hitSlop={8}
                onPress={(event) => { event.stopPropagation(); if (onToggleLike) onToggleLike(post.id); else setLiked((value) => !value); }}
                style={styles.engagementStat}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#D36E8B' : '#695E61'} />
                <Text style={[styles.engagementText, liked && styles.engagementTextActive]}>{(post.likeCount + (liked ? 1 : 0)).toLocaleString('ko-KR')}</Text>
              </Pressable>
              <View style={styles.engagementStat}>
                <Ionicons name="chatbubble-outline" size={18} color="#695E61" />
                <Text style={styles.engagementText}>{post.commentCount}</Text>
              </View>
              <Pressable
                accessibilityLabel="공유"
                hitSlop={8}
                onPress={(event) => { event.stopPropagation(); sharePost(); }}
              >
                <Ionicons name="share-social-outline" size={20} color="#695E61" />
              </Pressable>
            </View>
            <Pressable
              accessibilityLabel={saved ? '저장 취소' : '저장'}
              hitSlop={8}
              onPress={(event) => { event.stopPropagation(); if (onToggleSave) onToggleSave(post.id); else setSaved((value) => !value); }}
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={21} color={saved ? '#D36E8B' : '#695E61'} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen ? () => onOpen(post.id) : onPress}
      style={({ pressed }) => [styles.card, featured && styles.featuredCard, pressed && styles.pressed]}
    >
      {media ? (
        <View>
          <DecoratedImage
            image={media}
            fallbackLabel="POST"
            style={featured ? styles.featuredImage : styles.thumbnail}
          />
        </View>
      ) : null}
      <View style={[styles.body, featured && styles.featuredBody]}>
        <View style={styles.metaRow}>
          {author?.avatarUrl ? (
            <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{post.authorName.slice(0, 1)}</Text>
            </View>
          )}
          <View style={styles.authorBlock}>
            <View style={styles.authorLine}>
              <Text style={styles.author}>{post.authorName}</Text>
              {post.authorRole === 'shop_owner' ? (
                <Ionicons name="storefront" size={13} color="#B66F84" />
              ) : null}
            </View>
            <Text style={styles.date}>{post.createdAt.slice(5).replace('.', '/')}</Text>
          </View>
          <View style={styles.metaSpacer} />
          <View style={[styles.categoryPill, { backgroundColor: palette.soft }]}>
            <Text style={[styles.category, { color: palette.ink }]}>{post.category}</Text>
          </View>
        </View>
        <Text style={[styles.title, featured && styles.featuredTitle]} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.preview} numberOfLines={featured ? 2 : 2}>{post.preview}</Text>
        <View style={styles.bottom}>
          <View style={styles.statGroup}>
            <View style={styles.stat}><Ionicons name="heart-outline" size={15} color="#A36F7E" /><Text style={styles.statText}>{post.likeCount}</Text></View>
            <View style={styles.stat}><Ionicons name="chatbubble-outline" size={14} color="#A36F7E" /><Text style={styles.statText}>{post.commentCount}</Text></View>
          </View>
          <Ionicons name="bookmark-outline" size={18} color="#9E9295" />
        </View>
      </View>
    </Pressable>
  );
}

export default memo(BlogPostCard);

function getPostPalette(category: string) {
  switch (category) {
    case '질문': return { soft: '#E9E3F5', ink: '#675484' };
    case '후기': return { soft: '#F5E1E8', ink: '#8D5265' };
    case '추천': return { soft: '#DDEDE7', ink: '#496F61' };
    case '샵후기': return { soft: '#F3E1D8', ink: '#865944' };
    default: return { soft: '#EEE5D4', ink: '#78633E' };
  }
}

const styles = StyleSheet.create({
  socialPost: { backgroundColor: '#FFFFFF' },
  socialPressed: { opacity: 0.92 },
  socialHeader: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
  socialImage: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.lightPink },
  socialBody: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 14 },
  textOnlyBody: { paddingTop: 24, paddingBottom: 22, minHeight: 210, justifyContent: 'center' },
  socialTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, letterSpacing: -0.35 },
  socialPreview: { ...TYPOGRAPHY.bodyMedium, color: '#625A5C', marginTop: 7 },
  readMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 11 },
  readMore: { ...TYPOGRAPHY.labelLarge, color: '#8E5365' },
  nailTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  nailTag: { minHeight: 25, justifyContent: 'center', borderRadius: 13, paddingHorizontal: 10, backgroundColor: '#FAF0F3', borderWidth: 1, borderColor: '#F2DDE4' },
  nailTagText: { ...TYPOGRAPHY.labelMedium, color: '#9A6072' },
  engagementRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  engagementStats: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  engagementStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  engagementText: { ...TYPOGRAPHY.caption, color: '#695E61' },
  engagementTextActive: { color: '#B55A75' },
  card: {
    minHeight: 150,
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E9EB',
  },
  featuredCard: { flexDirection: 'column', padding: 0, overflow: 'hidden', borderWidth: 0, ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(56, 39, 45, 0.09)' }, default: { shadowColor: '#38272D', shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 } }) },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  thumbnail: { width: 112, height: 122, borderRadius: RADIUS.md, backgroundColor: COLORS.lightPink },
  featuredImage: { width: '100%', aspectRatio: 4 / 3, backgroundColor: COLORS.lightPink },
  body: { flex: 1, minWidth: 0, paddingRight: 14 },
  featuredBody: { padding: 18, backgroundColor: '#FFFFFF' },
  metaRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#292526' },
  avatarText: { ...TYPOGRAPHY.labelMedium, color: '#FFFFFF' },
  authorBlock: { justifyContent: 'center', flex: 1, minWidth: 0 },
  authorLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaSpacer: { flex: 1 },
  categoryPill: { borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 5, maxWidth: '38%' },
  category: { ...TYPOGRAPHY.labelMedium, color: '#9B5369' },
  author: { ...TYPOGRAPHY.labelMedium, color: '#4E4547', flexShrink: 1 },
  date: { ...TYPOGRAPHY.caption, color: '#A49A9D', marginTop: 1 },
  title: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 9, letterSpacing: -0.25 },
  featuredTitle: { ...TYPOGRAPHY.titleMedium, marginTop: 11 },
  preview: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 6 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12 },
  statGroup: { flexDirection: 'row', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...TYPOGRAPHY.caption, color: '#806F74' },
});
