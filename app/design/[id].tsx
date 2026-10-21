import { useFavorites } from '@/hooks/useFavorites';
import { TYPOGRAPHY } from '@/constants/typography';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DesignResultCard from '@/components/DesignResultCard';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import ShopResultCard from '@/components/ShopResultCard';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { GRID_COLUMN_GAP, GRID_ROW_GAP, GRID_THUMBNAIL_GAP } from '@/constants/layout';
import { designs, shops } from '@/data/mockData';

const INK = '#241B1E';
const MUTED = '#7F7377';

export default function DesignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const galleryRef = useRef<ScrollView>(null);
  const [saved, toggleSaved] = useFavorites('designIds', id);
  const [liked, toggleLiked] = useFavorites('designLikes', id);
  const [activePhoto, setActivePhoto] = useState(0);
  const design = designs.find((item) => item.id === id);

  if (!design) {
    return <SafeAreaView style={styles.safe}><ScreenHeader title="디자인" /><EmptyState title="디자인을 찾을 수 없어요" /></SafeAreaView>;
  }

  const availableShops = shops.filter((shop) => design.availableShopIds.includes(shop.id));
  const similar = designs.filter((item) => item.id !== design.id).slice(0, 2);
  const photos = (design.photos?.length ? [...design.photos] : design.imageUrl ? [{ id: `${design.id}-cover`, imageUrl: design.imageUrl, uploaderName: 'Naily', uploaderType: 'shop' as const, likeCount: 0 }] : [])
    .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  const previewPhotos = photos.slice(0, 5);
  const galleryWidth = width - 24;
  const thumbnailWidth = (galleryWidth - GRID_THUMBNAIL_GAP * 5) / 6;
  const selectPhoto = (index: number) => {
    setActivePhoto(index);
    galleryRef.current?.scrollTo({ x: galleryWidth * index, animated: true });
  };
  const finishPhotoSwipe = (event: NativeSyntheticEvent<NativeScrollEvent>) => setActivePhoto(Math.round(event.nativeEvent.contentOffset.x / galleryWidth));
  const openAlbum = (index = activePhoto) => {
    router.push({ pathname: '/design-gallery', params: { designId: design.id, index: String(index) } });
  };
  const shareDesign = () => Share.share({ message: `Naily에서 ${design.title} 디자인을 확인해보세요!` });
  const reserveDesign = () => router.push({ pathname: '/booking', params: { designId: design.id } });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.scrollViewport}>
      <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={finishPhotoSwipe}
          >
            {previewPhotos.map((photo, index) => <Pressable key={photo.id} accessibilityLabel={`${index + 1}번째 사진 크게 보기`} onPress={() => openAlbum(index)} style={{ width: galleryWidth }}><Image source={{ uri: photo.imageUrl }} style={styles.hero} /></Pressable>)}
          </ScrollView>
          <LinearGradient pointerEvents="none" colors={['rgba(24,15,18,0.32)', 'transparent', 'rgba(24,15,18,0.12)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroNav}>
            <RoundButton icon="chevron-back" label="뒤로 가기" onPress={() => router.back()} />
          </View>
        </View>

        {previewPhotos.length ? (
          <View style={styles.galleryControls}>
            <View style={styles.thumbnailTrack}>
              {previewPhotos.map((photo, index) => (
                <Pressable key={photo.id} accessibilityLabel={`${index + 1}번째 사진 보기`} onPress={() => selectPhoto(index)} style={[styles.thumbnailWrap, { width: thumbnailWidth }, index === activePhoto && styles.thumbnailActive]}>
                  <Image source={{ uri: photo.imageUrl }} style={styles.thumbnail} />
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" accessibilityLabel={`전체 사진 ${photos.length}장 보기`} onPress={() => openAlbum()} style={({ pressed }) => [styles.albumButton, { width: thumbnailWidth }, pressed && styles.albumButtonPressed]}>
                <View style={styles.albumButtonInner}>
                  <Ionicons name="grid-outline" size={18} color="#403A3C" />
                  <Text style={styles.albumButtonText}>전체</Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.body}>
          <Text style={styles.title}>{design.title}</Text>
          <Text style={styles.description}>{design.description}</Text>

          <View style={styles.tags}>
            {design.tags.map((tag) => {
              const normalizedTag = tag.replace(/^#/, '');
              return (
                <Pressable
                  key={tag}
                  accessibilityRole="link"
                  accessibilityLabel={`${normalizedTag} 태그의 디자인 검색`}
                  hitSlop={6}
                  onPress={() => router.push({ pathname: '/search', params: { query: normalizedTag, category: 'design' } })}
                  style={({ pressed }) => pressed && styles.tagPressed}
                >
                  <Text style={styles.tagText}>#{normalizedTag}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>예상 시술가</Text>
              <Text style={styles.price}>{design.estimatedPrice}</Text>
              <Text style={styles.priceHint}>샵과 옵션에 따라 달라질 수 있어요</Text>
            </View>
            <View style={styles.priceIcon}><Ionicons name="sparkles-outline" size={22} color={COLORS.primary} /></View>
          </View>

          <View style={styles.socialRow}>
            <SocialButton icon={liked ? 'heart' : 'heart-outline'} label="좋아요" count={design.likeCount + (liked ? 1 : 0)} active={liked} onPress={() => toggleLiked()} />
            <View style={styles.socialDivider} />
            <SocialButton icon={saved ? 'bookmark' : 'bookmark-outline'} label="저장" count={design.savedCount + (saved ? 1 : 0)} active={saved} onPress={() => toggleSaved()} />
            <View style={styles.socialDivider} />
            <SocialButton icon="share-social-outline" label="공유하기" onPress={shareDesign} />
          </View>

          <SectionHeader title="예약 가능한 네일샵" description="이 디자인을 시술할 수 있는 샵이에요" />
          <View style={styles.list}>
            {availableShops.map((shop) => <ShopResultCard key={shop.id} shop={shop} onPress={() => router.push(`/shop/${shop.id}`)} />)}
          </View>

          <SectionHeader title="비슷한 무드의 디자인" description="취향에 맞을 만한 디자인을 골랐어요" />
          <View style={styles.grid}>
            {similar.map((item) => <DesignResultCard key={item.id} separated design={item} onPress={() => router.push(`/design/${item.id}`)} />)}
          </View>
        </View>
      </ScrollView>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <Pressable accessibilityLabel={saved ? '저장 취소' : '디자인 저장'} onPress={() => toggleSaved()} style={[styles.saveButton, saved && styles.saveButtonActive]}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={23} color={saved ? '#FFFFFF' : INK} />
        </Pressable>
        <PrimaryButton label="이 디자인으로 예약하기" onPress={reserveDesign} style={styles.reserveButton} />
      </View>

    </SafeAreaView>
  );
}

function RoundButton({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} onPress={onPress} style={[styles.roundButton, active && styles.roundButtonActive]}><Ionicons name={icon} size={22} color={active ? '#FFFFFF' : INK} /></Pressable>;
}

function SocialButton({ icon, label, count, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; count?: number; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.socialButton}>
      <Ionicons name={icon} size={21} color={active ? COLORS.primary : MUTED} />
      <Text style={[styles.socialLabel, active && styles.socialLabelActive]}>{label}{count !== undefined ? ` ${count}` : ''}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionDescription}>{description}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollViewport: { flex: 1 },
  scrollContent: { paddingBottom: 26 },
  heroWrap: { height: 430, marginHorizontal: 12, borderRadius: 28, overflow: 'hidden', backgroundColor: COLORS.lightPink },
  hero: { width: '100%', height: 430 },
  heroNav: { position: 'absolute', top: 16, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  galleryControls: { minHeight: 58, justifyContent: 'center', marginTop: 12, paddingHorizontal: 12 },
  thumbnailTrack: { flexDirection: 'row', gap: GRID_THUMBNAIL_GAP },
  thumbnailWrap: { aspectRatio: 1, padding: 2, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  thumbnailActive: { borderColor: COLORS.primary },
  thumbnail: { width: '100%', height: '100%', borderRadius: 10, backgroundColor: COLORS.lightPink },
  albumButton: { aspectRatio: 1, padding: 2, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  albumButtonInner: { flex: 1, width: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F1F1' },
  albumButtonText: { ...TYPOGRAPHY.labelMedium, color: '#514A4C', marginTop: 2 },
  albumButtonPressed: { opacity: 0.65, transform: [{ scale: 0.96 }] },
  roundButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#33252A', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  roundButtonActive: { backgroundColor: COLORS.primary },
  body: { paddingHorizontal: SPACING.md, paddingTop: 24 },
  title: { ...TYPOGRAPHY.titleLarge, color: INK },
  description: { ...TYPOGRAPHY.bodyLarge, color: MUTED, marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 5, marginTop: 14 },
  tagText: { ...TYPOGRAPHY.labelMedium, color: '#A6697A' },
  tagPressed: { opacity: 0.48 },
  priceCard: { marginTop: 22, padding: 18, borderRadius: 20, backgroundColor: '#272023', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { ...TYPOGRAPHY.caption, color: '#C9BEC2' },
  price: { ...TYPOGRAPHY.titleSmall, color: '#FFFFFF', marginTop: 4 },
  priceHint: { ...TYPOGRAPHY.caption, color: '#9F9397', marginTop: 3 },
  priceIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#44383C' },
  socialRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 4, backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: '#F0EAEC' },
  socialButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  socialLabel: { ...TYPOGRAPHY.caption, color: MUTED },
  socialLabelActive: { color: COLORS.primary },
  socialDivider: { width: 1, height: 25, backgroundColor: '#EEE8EA' },
  sectionHeader: { marginTop: 32, marginBottom: 13 },
  sectionTitle: { ...TYPOGRAPHY.titleMedium, color: INK },
  sectionDescription: { ...TYPOGRAPHY.bodySmall, color: MUTED, marginTop: 3 },
  list: { gap: 10 },
  grid: { flexDirection: 'row', columnGap: GRID_COLUMN_GAP, rowGap: GRID_ROW_GAP },
  bottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 8, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: '#F0EAEC', shadowColor: '#2B1B20', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 8 },
  saveButton: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: '#E7DFE2', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  saveButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  reserveButton: { flex: 1, minHeight: 52, borderRadius: 18 },
});
