import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CommunityPost } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';
import RoleBadge from './RoleBadge';
import DecoratedImage from './DecoratedImage';

export default function CommunityResultCard({ post, onPress }: { post: CommunityPost; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.84 }]}>
      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.category}>{post.category}</Text>
          <RoleBadge role={post.authorRole} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.preview} numberOfLines={2}>{post.preview}</Text>
        <Text style={styles.stats}>♡ {post.likeCount}   ◯ {post.commentCount}   · {post.createdAt}</Text>
      </View>
      {post.decoratedImage ? (
        <DecoratedImage image={post.decoratedImage} fallbackLabel="POST" style={styles.image} />
      ) : post.imageUrl ? (
        <DecoratedImage
          image={{ uri: post.imageUrl, aspectRatio: 1, decorations: [] }}
          fallbackLabel="POST"
          style={styles.image}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#F0EAEC', padding: 16, flexDirection: 'row', gap: 14 },
  content: { flex: 1 },
  meta: { flexDirection: 'row', gap: 7, alignItems: 'center', marginBottom: 8 },
  category: { ...TYPOGRAPHY.labelMedium, color: COLORS.primary },
  title: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  preview: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 6 },
  stats: { ...TYPOGRAPHY.caption, color: '#999999', marginTop: 10 },
  image: { width: 82, height: 82, borderRadius: RADIUS.sm, alignSelf: 'center' },
});
