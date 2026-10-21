import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING, GRID_COLUMN_GAP } from '@/constants/layout';
import { NearbyShop } from '@/types/models';
import { useHorizontalGestureBoundary } from '@/components/navigation/PagerGestureContext';
import HomeImage from './HomeImage';
import SectionHeader from './SectionHeader';
import { useTwoCardCarousel } from './useTwoCardCarousel';

type Props = {
  shops: NearbyShop[];
  onPressShop: (shop: NearbyShop) => void;
  onPressAll: () => void;
};

export default function NearbyShopsSection({ shops, onPressShop, onPressAll }: Props) {
  const horizontalGestureBoundary = useHorizontalGestureBoundary();
  const { cardWidth, onLayout } = useTwoCardCarousel();

  return (
    <View style={styles.section} onLayout={onLayout}>
      <SectionHeader
        title="내 주변 네일샵"
        subtitle="성수동 기준 · 가까운 순"
        onPressAction={onPressAll}
      />
      <ScrollView
        {...horizontalGestureBoundary}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {shops.map((shop) => (
          <Pressable
            key={shop.id}
            accessibilityRole="button"
            onPress={() => onPressShop(shop)}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.imageFrame}>
              <HomeImage uri={shop.imageUrl} fallbackLabel="NAIL SHOP" style={styles.image} />
              <View style={styles.distanceBadge}>
                <Text style={styles.distance}>{shop.distance}</Text>
              </View>
              {shop.isReservable ? (
                <View style={styles.reserveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.reserveText}>예약 가능</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.body}>
              <View style={styles.tags}>
                {shop.tags.slice(0, 2).map((tag) => (
                  <Text key={tag} numberOfLines={1} style={styles.tagText}>#{tag}</Text>
                ))}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {shop.name}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.rating}>★ {shop.rating.toFixed(1)}</Text>
                <Text style={styles.review}>({shop.reviewCount})</Text>
                <View style={styles.metaDot} />
                <Text ellipsizeMode="tail" numberOfLines={1} style={styles.area}>{shop.area}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
  },
  track: {
    gap: GRID_COLUMN_GAP,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  card: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.84,
  },
  imageFrame: {
    overflow: 'hidden',
    borderRadius: RADIUS.md,
  },
  image: {
    width: '100%',
    aspectRatio: 1.35,
  },
  distanceBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: 'rgba(24, 20, 21, 0.78)',
  },
  distance: { ...TYPOGRAPHY.caption, color: '#FFFFFF' },
  reserveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: COLORS.success,
  },
  reserveText: { ...TYPOGRAPHY.labelMedium, color: '#357958' },
  body: {
    marginTop: 8,
  },
  name: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 7, flexWrap: 'wrap', rowGap: 4 },
  rating: { ...TYPOGRAPHY.caption, color: '#C48A2B' },
  review: { ...TYPOGRAPHY.caption, color: '#A39A9D', marginLeft: 3 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 7,
    backgroundColor: '#C8BFC2',
  },
  area: { ...TYPOGRAPHY.caption, flex: 1, color: COLORS.subText },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 5,
  },
  tagText: { ...TYPOGRAPHY.labelMedium, flexShrink: 1, color: COLORS.primary },
});
