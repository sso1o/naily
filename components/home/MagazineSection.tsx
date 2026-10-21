import { TYPOGRAPHY } from '@/constants/typography';
import { useCallback, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING, GRID_COLUMN_GAP } from '@/constants/layout';
import { MagazineArticle } from '@/types/models';
import { useHorizontalGestureBoundary } from '@/components/navigation/PagerGestureContext';
import DecoratedImage, { hasDecorationTitle } from '../DecoratedImage';

type WebScrollStyle = ViewStyle & {
  overscrollBehaviorX?: 'contain';
  scrollPaddingLeft?: number;
  scrollPaddingRight?: number;
  scrollSnapType?: 'x mandatory';
};

type WebCardStyle = ViewStyle & {
  scrollSnapAlign?: 'start';
  scrollSnapStop?: 'always';
};

const webCardStyle: WebCardStyle | undefined =
  Platform.OS === 'web'
    ? {
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
      }
    : undefined;

type Props = {
  articles: MagazineArticle[];
  onPressArticle: (article: MagazineArticle) => void;
  onPressAll: () => void;
};

export default function MagazineSection({ articles, onPressArticle, onPressAll }: Props) {
  const horizontalGestureBoundary = useHorizontalGestureBoundary();
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const cardWidth = useMemo(() => {
    return Math.max(0, containerWidth - CONTENT_HORIZONTAL_PADDING * 2);
  }, [containerWidth]);

  const snapInterval = cardWidth + GRID_COLUMN_GAP;
  const sideInset =
    containerWidth > 0
      ? Math.max(CONTENT_HORIZONTAL_PADDING, (containerWidth - cardWidth) / 2)
      : CONTENT_HORIZONTAL_PADDING;
  const webScrollStyle: WebScrollStyle | undefined =
    Platform.OS === 'web'
      ? {
          overscrollBehaviorX: 'contain',
          scrollPaddingLeft: sideInset,
          scrollPaddingRight: sideInset,
          scrollSnapType: 'x mandatory',
        }
      : undefined;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setContainerWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.max(
        0,
        Math.min(
          articles.length - 1,
          Math.round(event.nativeEvent.contentOffset.x / snapInterval),
        ),
      );

      if (nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }
    },
    [articles.length, snapInterval],
  );

  return (
    <View style={styles.section} onLayout={handleLayout}>
      <FlatList
        {...horizontalGestureBoundary}
        data={articles}
        horizontal
        keyExtractor={(article) => article.id}
        renderItem={({ item: article }) => {
          const image = article.decoratedImage ?? {
            uri: article.imageUrl ?? '',
            aspectRatio: 4 / 5,
            decorations: [],
          };
          const usesDecoratedTitle = hasDecorationTitle(article.decoratedImage);

          return (
            <Pressable
            accessibilityLabel={`${article.category}, ${article.title}`}
            accessibilityRole="button"
            onPress={() => onPressArticle(article)}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth },
              webCardStyle,
              pressed && styles.pressed,
            ]}
          >
            <DecoratedImage
              image={image}
              fallbackLabel="MAGAZINE"
              style={styles.image}
            />
            <View style={styles.categoryPill}>
              <Text style={styles.category} numberOfLines={1}>
                {article.category}
              </Text>
            </View>
            {usesDecoratedTitle ? (
              <View style={styles.decoratedMeta}>
                <Text style={styles.decoratedMetaText} numberOfLines={1}>
                  {article.authorName} · {article.readingTime}
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[
                  'rgba(15, 10, 12, 0)',
                  'rgba(15, 10, 12, 0.36)',
                  'rgba(15, 10, 12, 0.92)',
                ]}
                locations={[0, 0.38, 1]}
                style={[styles.gradient, styles.gradientPointerEvents]}
              >
                <Text style={styles.description} numberOfLines={1}>
                  {article.description}
                </Text>
                <Text style={styles.title} numberOfLines={2}>
                  {article.title}
                </Text>
                <View style={styles.meta}>
                  <Text style={styles.author} numberOfLines={1}>
                    {article.authorName}
                  </Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.reading}>{article.readingTime} 읽기</Text>
                </View>
              </LinearGradient>
            )}
          </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
        nestedScrollEnabled
        decelerationRate="fast"
        disableIntervalMomentum
        snapToAlignment="start"
        snapToInterval={snapInterval}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        style={webScrollStyle}
        contentContainerStyle={[
          styles.track,
          { paddingLeft: sideInset, paddingRight: sideInset },
        ]}
      />
      {articles.length > 1 && (
        <View
          accessibilityLabel={`${articles.length}개 중 ${activeIndex + 1}번째 매거진`}
          style={styles.indicator}
        >
          {articles.map((article, index) => (
            <View
              key={article.id}
              style={[
                styles.indicatorDot,
                index === activeIndex && styles.indicatorDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },
  track: {},
  separator: {
    width: GRID_COLUMN_GAP,
  },
  card: {
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    aspectRatio: 4 / 5,
    backgroundColor: COLORS.lightPink,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  categoryPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    maxWidth: '46%',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(28, 20, 23, 0.76)',
  },
  category: { ...TYPOGRAPHY.labelMedium, color: '#FFFFFF', letterSpacing: 1 },
  gradient: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '68%',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  gradientPointerEvents: {
    pointerEvents: 'none',
  },
  title: { ...TYPOGRAPHY.titleLarge, color: '#FFFFFF', letterSpacing: -0.7 },
  description: { ...TYPOGRAPHY.bodySmall, color: 'rgba(255, 255, 255, 0.86)', marginBottom: 5 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  author: { ...TYPOGRAPHY.labelMedium, maxWidth: '55%', color: 'rgba(255, 255, 255, 0.9)' },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  reading: { ...TYPOGRAPHY.caption, color: 'rgba(255, 255, 255, 0.72)' },
  decoratedMeta: {
    position: 'absolute',
    top: 14,
    right: 14,
    maxWidth: '42%',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: 'rgba(28, 20, 23, 0.7)',
  },
  decoratedMetaText: { ...TYPOGRAPHY.caption, color: '#FFFFFF' },
  indicator: {
    minHeight: 18,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D5CBCF',
  },
  indicatorDotActive: {
    width: 15,
    backgroundColor: COLORS.primary,
  },
});
