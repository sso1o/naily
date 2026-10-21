import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING, GRID_COLUMN_GAP } from '@/constants/layout';
import { MonthlyArt } from '@/types/models';
import { useHorizontalGestureBoundary } from '@/components/navigation/PagerGestureContext';
import HomeImage from './HomeImage';
import SectionHeader from './SectionHeader';
import { useTwoCardCarousel } from './useTwoCardCarousel';
import ThumbnailHeartButton from '@/components/ThumbnailHeartButton';

type Props = {
  arts: MonthlyArt[];
  onPressArt: (art: MonthlyArt) => void;
  onPressShop: (art: MonthlyArt) => void;
  onPressAll: () => void;
};

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function MonthlyArtSection({
  arts,
  onPressArt,
  onPressShop,
  onPressAll,
}: Props) {
  const horizontalGestureBoundary = useHorizontalGestureBoundary();
  const { cardWidth, onLayout } = useTwoCardCarousel();

  return (
    <View style={styles.section} onLayout={onLayout}>
      <SectionHeader
        title="내 주변 이달의 아트"
        subtitle="이번 달에만 만나는 가까운 샵의 디자인"
        onPressAction={onPressAll}
      />
      <ScrollView
        {...horizontalGestureBoundary}
        horizontal
        nestedScrollEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {arts.map((art) => (
          <Pressable
            key={art.id}
            accessibilityRole="button"
            onPress={() => onPressArt(art)}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.imageFrame}>
              <HomeImage uri={art.imageUrl} fallbackLabel="MONTHLY ART" style={styles.image} />
              <ThumbnailHeartButton designId={art.designId} />
            </View>
            <View style={styles.body}>
              <Pressable
                hitSlop={5}
                onPress={(event) => {
                  event.stopPropagation();
                  onPressShop(art);
                }}
              >
                <Text ellipsizeMode="tail" style={styles.shop} numberOfLines={1}>
                  {art.shopName}
                </Text>
              </Pressable>
              <View style={styles.priceRow}>
                {art.discountedPrice ? (
                  <>
                    <Text style={styles.originalPrice}>{formatPrice(art.price)}</Text>
                    <Text style={styles.price}>{formatPrice(art.discountedPrice)}</Text>
                  </>
                ) : (
                  <Text style={styles.price}>{formatPrice(art.price)}</Text>
                )}
              </View>
              <Text style={styles.likes}>♡ {art.likeCount.toLocaleString('ko-KR')}</Text>
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
    aspectRatio: 0.9,
  },
  body: {
    marginTop: 8,
  },
  shop: { ...TYPOGRAPHY.labelLarge, color: COLORS.primary },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 5,
    marginTop: 5,
  },
  originalPrice: { ...TYPOGRAPHY.caption, color: '#B2A8AB', textDecorationLine: 'line-through' },
  price: { ...TYPOGRAPHY.labelLarge, color: '#9B5267', marginTop: 1 },
  likes: { ...TYPOGRAPHY.caption, color: '#9D9295', marginTop: 5 },
});
