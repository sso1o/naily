import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Shop } from '@/types/models';
import { COLORS, RADIUS } from '@/constants/colors';

export default function ShopResultCard({ shop, onPress }: { shop: Shop; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.84 }]}>
      <Image source={{ uri: shop.imageUrl }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
          <View style={[styles.status, !shop.isOpen && styles.closed]}>
            <Text style={[styles.statusText, !shop.isOpen && styles.closedText]}>{shop.isOpen ? '영업중' : '영업종료'}</Text>
          </View>
        </View>
        <Text style={styles.address} numberOfLines={1}>{shop.address} · {shop.distance}</Text>
        <Text style={styles.rating}>★ {shop.rating.toFixed(1)} <Text style={styles.review}>리뷰 {shop.reviewCount}</Text></Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'transparent', flexDirection: 'row', gap: 13 },
  image: { width: 116, height: 116, borderRadius: RADIUS.md, backgroundColor: COLORS.lightPink },
  body: { flex: 1, justifyContent: 'center', minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  name: { ...TYPOGRAPHY.labelLarge, flex: 1, color: COLORS.text, minWidth: 70 },
  status: { backgroundColor: '#EAF6EF', paddingHorizontal: 7, paddingVertical: 4, borderRadius: RADIUS.pill },
  closed: { backgroundColor: '#F1F1F1' },
  statusText: { ...TYPOGRAPHY.labelMedium, color: COLORS.success },
  closedText: { color: COLORS.subText },
  address: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 6 },
  rating: { ...TYPOGRAPHY.caption, color: '#E6A64A', marginTop: 7 },
  review: { fontWeight: FONT_WEIGHT.regular, color: COLORS.subText },
});
