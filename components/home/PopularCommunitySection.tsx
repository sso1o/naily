import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING } from '@/constants/layout';
import { PopularCommunityPost } from '@/types/models';
import DecoratedImage from '../DecoratedImage';
import HomeImage from './HomeImage';
import SectionHeader from './SectionHeader';

type Props = {
  posts: PopularCommunityPost[];
  onPressPost: (post: PopularCommunityPost) => void;
  onPressAll: () => void;
};

export default function PopularCommunitySection({ posts, onPressPost, onPressAll }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="커뮤니티 인기글"
        subtitle="네일리 유저들이 지금 많이 보는 이야기"
        onPressAction={onPressAll}
      />
      <View style={styles.list}>
        {posts.map((post, index) => (
          <Pressable
            key={post.id}
            accessibilityRole="button"
            onPress={() => onPressPost(post)}
            style={({ pressed }) => [
              styles.card,
              index < posts.length - 1 && styles.cardDivider,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.authorRow}>
              <HomeImage
                uri={post.authorAvatarUrl}
                fallbackLabel={post.authorName.slice(0, 1)}
                style={styles.avatar}
              />
              <Text style={styles.author} numberOfLines={1}>{post.authorName}</Text>
              {post.isShopVerified ? (
                <View style={styles.verified}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              ) : null}
              <Text style={styles.time}>· {post.relativeTime}</Text>
            </View>
            <View style={styles.contentRow}>
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {post.preview}
                </Text>
              </View>
              {post.decoratedImage ? (
                <DecoratedImage
                  image={post.decoratedImage}
                  fallbackLabel="POST"
                  style={styles.thumbnail}
                />
              ) : post.imageUrl ? (
                <HomeImage uri={post.imageUrl} fallbackLabel="POST" style={styles.thumbnail} />
              ) : null}
            </View>
            <View style={styles.stats}>
              <Text style={styles.stat}>♥ {post.likeCount}</Text>
              <Text style={styles.stat}>댓글 {post.commentCount}</Text>
              <Text style={styles.stat}>조회 {post.viewCount.toLocaleString('ko-KR')}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
  },
  list: {
    marginHorizontal: CONTENT_HORIZONTAL_PADDING,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#EEE8EA',
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
  },
  cardDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECEE',
  },
  pressed: {
    backgroundColor: '#FCF7F9',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 4 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  author: { ...TYPOGRAPHY.labelMedium, flexShrink: 1, color: COLORS.text },
  verified: { minWidth: 18, minHeight: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginLeft: 4, backgroundColor: COLORS.primary },
  verifiedText: { ...TYPOGRAPHY.caption, color: '#FFFFFF' },
  time: { ...TYPOGRAPHY.caption, color: '#A49A9D', marginLeft: 5 },
  contentRow: {
    flexDirection: 'row',
    marginTop: 11,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 13,
  },
  title: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  preview: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 5 },
  thumbnail: {
    width: 78,
    height: 78,
    borderRadius: RADIUS.sm,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    marginTop: 12,
  },
  stat: { ...TYPOGRAPHY.caption, color: '#9A8F92' },
});
