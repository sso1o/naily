import { TYPOGRAPHY } from '@/constants/typography';
import { StyleSheet, Text, View } from 'react-native';
import { Review } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{review.userName.slice(0, 1)}</Text></View>
        <View>
          <Text style={styles.name}>{review.userName}</Text>
          <Text style={styles.stars}>{'★'.repeat(Math.round(review.rating))}</Text>
        </View>
        <Text style={styles.date}>{review.createdAt}</Text>
      </View>
      <Text style={styles.content}>{review.content}</Text>
      {review.ownerReply ? <Text style={styles.content}>샵 답변: {review.ownerReply}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, padding: 15, borderRadius: RADIUS.md },
  top: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightPink, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  avatarText: { ...TYPOGRAPHY.labelMedium, color: COLORS.primary },
  name: { ...TYPOGRAPHY.labelMedium, color: COLORS.text, flexShrink: 1 },
  stars: { ...TYPOGRAPHY.caption, color: '#E6A64A', marginTop: 2 },
  date: { ...TYPOGRAPHY.caption, marginLeft: 'auto', color: '#999999' },
  content: { ...TYPOGRAPHY.bodyMedium, color: COLORS.subText, marginTop: 11 },
});
