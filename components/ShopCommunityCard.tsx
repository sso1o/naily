import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CommunityPost } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';

export default function ShopCommunityCard({ post, onPress }: { post: CommunityPost; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.top}>
        <View style={styles.lock}><Text style={styles.lockText}>샵</Text></View>
        <Text style={styles.category}>{post.category}</Text>
        <Text style={styles.date}>{post.createdAt}</Text>
      </View>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.preview} numberOfLines={2}>{post.preview}</Text>
      <View style={styles.footer}>
        <Text style={styles.author}>✓ {post.authorName}</Text>
        <Text style={styles.stats}>♡ {post.likeCount}  ◯ {post.commentCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFDFC', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#EADDD5', padding: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lock: { borderRadius: RADIUS.pill, backgroundColor: '#7C695D', paddingHorizontal: 8, paddingVertical: 4 },
  lockText: { ...TYPOGRAPHY.labelMedium, color: '#FFFFFF' },
  category: { ...TYPOGRAPHY.labelMedium, color: '#8A6D5C' },
  date: { ...TYPOGRAPHY.caption, marginLeft: 'auto', color: '#A59890' },
  title: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 13 },
  preview: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 7 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  author: { ...TYPOGRAPHY.labelMedium, color: '#7C695D' },
  stats: { ...TYPOGRAPHY.caption, color: '#A59890' },
});
