import { TYPOGRAPHY } from '@/constants/typography';
import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ZoomableGalleryImage from '@/components/ZoomableGalleryImage';
import { COLORS, RADIUS } from '@/constants/colors';
import { GRID_COLUMN_GAP, GRID_ROW_GAP } from '@/constants/layout';
import { designs } from '@/data/mockData';

type GallerySort = 'popular' | 'latest';

export default function DesignGalleryScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { designId } = useLocalSearchParams<{ designId: string }>();
  const design = designs.find((item) => item.id === designId);
  const [sort, setSort] = useState<GallerySort>('popular');
  const photos = useMemo(() => {
    const items = design?.photos?.length ? [...design.photos] : design?.imageUrl ? [{ id: `${design.id}-cover`, imageUrl: design.imageUrl, uploaderName: 'Naily', uploaderType: 'shop' as const, likeCount: 0 }] : [];
    return items.sort((a, b) => sort === 'popular'
      ? (b.likeCount ?? 0) - (a.likeCount ?? 0)
      : (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
  }, [design, sort]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const cardWidth = (width - 32 - GRID_COLUMN_GAP) / 2;

  // Match the header: close the local viewer before leaving the gallery route.
  usePreventRemove(selectedPhoto !== null, () => setSelectedPhoto(null));

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedPhoto === null) return false;
      setSelectedPhoto(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedPhoto]));

  const openViewer = (photoIndex: number) => {
    setSelectedPhoto(photoIndex);
  };
  const goBack = () => selectedPhoto === null ? router.back() : setSelectedPhoto(null);

  if (!design || photos.length === 0) {
    return <SafeAreaView style={styles.listSafe} edges={['top']}><Stack.Screen options={{ animation: 'slide_from_right' }} /><Header title="사진첩" onBack={() => router.back()} /><Text style={styles.empty}>사진을 찾을 수 없어요</Text><TouchBlocker height={insets.bottom} /></SafeAreaView>;
  }

  if (selectedPhoto !== null) {
    return (
      <View style={styles.viewerSafe}>
        <Stack.Screen options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <StatusBar style="light" />
        <View style={styles.viewerPhoto}><ZoomableGalleryImage key={photos[selectedPhoto].id} uri={photos[selectedPhoto].imageUrl} width={width} height={height} /></View>
        <SafeAreaView pointerEvents="box-none" style={styles.viewerOverlay} edges={['top']}>
          <View style={styles.viewerHeader}>
            <BackButton onPress={goBack} light />
            <View style={styles.viewerHeading}><Text numberOfLines={1} style={styles.viewerTitle}>{design.title}</Text></View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <View style={[styles.viewerMeta, { bottom: insets.bottom + 16 }]}>
          <Text style={styles.viewerUploader}>{photos[selectedPhoto].uploaderName}</Text>
          <Text style={styles.viewerDate}>{photos[selectedPhoto].uploadedAt ?? '업로드 날짜 정보 없음'}</Text>
        </View>
        <TouchBlocker height={insets.bottom} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.listSafe} edges={['top']}>
      <Stack.Screen options={{ animation: 'slide_from_right', presentation: 'card' }} />
      <StatusBar style="dark" />
      <Header title="사진첩" subtitle={`사진 ${photos.length}장`} onBack={goBack} />
      <View accessibilityRole="tablist" style={styles.sortBar}>
        <SortButton label="인기순" selected={sort === 'popular'} onPress={() => setSort('popular')} />
        <SortButton label="최신순" selected={sort === 'latest'} onPress={() => setSort('latest')} />
      </View>
      <ScrollView indicatorStyle="black" showsVerticalScrollIndicator contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}>
        {photos.map((photo, photoIndex) => (
          <View key={photo.id} style={[styles.card, { width: cardWidth }]}>
            <Pressable accessibilityLabel={`${photo.uploaderName}의 사진 크게 보기`} onPress={() => openViewer(photoIndex)}>
              <Image source={{ uri: photo.imageUrl }} style={styles.cardImage} />
              <View style={styles.expandBadge}><Ionicons name="expand-outline" size={17} color="#FFFFFF" /></View>
            </Pressable>
            <View style={styles.cardMeta}>
              {photo.uploaderAvatarUrl ? <Image source={{ uri: photo.uploaderAvatarUrl }} style={styles.uploaderAvatar} /> : <View style={styles.uploaderFallback}><Text style={styles.uploaderFallbackText}>{photo.uploaderName[0]}</Text></View>}
              <View style={styles.uploaderCopy}><Text numberOfLines={1} style={styles.uploaderName}>{photo.uploaderName}</Text><Text numberOfLines={1} style={styles.uploadedAt}>{photo.uploadedAt ?? '날짜 정보 없음'}</Text></View>
              <Text style={styles.likeCount}>♡ {(photo.likeCount ?? 0).toLocaleString('ko-KR')}</Text>
            </View>
            {photo.postId ? <Pressable accessibilityRole="link" onPress={() => router.push(`/post/${photo.postId}`)} style={({ pressed }) => [styles.postButton, pressed && styles.pressed]}><Text style={styles.postButtonText}>게시글 보기</Text><Ionicons name="arrow-forward" size={16} color="#6F5F64" /></Pressable> : null}
          </View>
        ))}
      </ScrollView>
      <TouchBlocker height={insets.bottom} />
    </SafeAreaView>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return <View style={styles.header}><BackButton onPress={onBack} /><View style={styles.heading}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View><View style={styles.headerSpacer} /></View>;
}

function BackButton({ onPress, light = false }: { onPress: () => void; light?: boolean }) {
  return <Pressable accessibilityLabel="뒤로 가기" accessibilityRole="button" hitSlop={8} onPress={onPress} style={styles.backButton}><Ionicons name="arrow-back" size={25} color={light ? '#FFFFFF' : '#241B1E'} /></Pressable>;
}

function SortButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.sortButton, selected && styles.sortButtonSelected]}><Text style={[styles.sortText, selected && styles.sortTextSelected]}>{label}</Text>{selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}</Pressable>;
}

function TouchBlocker({ height }: { height: number }) {
  if (height <= 0) return null;
  return <View pointerEvents="auto" style={[styles.touchBlocker, { height }]} />;
}

const styles = StyleSheet.create({
  listSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, alignItems: 'center' },
  title: { ...TYPOGRAPHY.titleSmall, color: '#241B1E' },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 2 },
  headerSpacer: { width: 44 },
  sortBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
  sortButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 13, borderRadius: RADIUS.pill, backgroundColor: '#F5F1F2' },
  sortButtonSelected: { backgroundColor: '#241B1E' },
  sortText: { ...TYPOGRAPHY.labelLarge, color: COLORS.subText },
  sortTextSelected: { color: '#FFFFFF' },
  list: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_COLUMN_GAP, rowGap: GRID_ROW_GAP, padding: 16 },
  card: { overflow: 'hidden', borderRadius: RADIUS.lg, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE8EA' },
  cardImage: { width: '100%', aspectRatio: 1, backgroundColor: COLORS.lightPink },
  expandBadge: { position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,24,26,0.68)' },
  cardMeta: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  uploaderAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.lightPink },
  uploaderFallback: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightPink },
  uploaderFallbackText: { ...TYPOGRAPHY.labelMedium, color: COLORS.primary },
  uploaderCopy: { minWidth: 0, flex: 1, marginLeft: 7 },
  uploaderName: { ...TYPOGRAPHY.labelMedium, color: '#241B1E' },
  uploadedAt: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 2 },
  likeCount: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginLeft: 4 },
  postButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, backgroundColor: '#FAF8F9' },
  postButtonText: { ...TYPOGRAPHY.labelLarge, color: '#6F5F64' },
  pressed: { opacity: 0.55 },
  empty: { ...TYPOGRAPHY.bodyMedium, color: COLORS.subText, textAlign: 'center', marginTop: 80 },
  viewerSafe: { flex: 1, backgroundColor: '#161214' },
  viewerPhoto: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  viewerOverlay: { ...StyleSheet.absoluteFill, zIndex: 5 },
  viewerHeader: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  viewerHeading: { flex: 1, alignItems: 'center' },
  viewerTitle: { ...TYPOGRAPHY.titleSmall, color: '#FFFFFF' },
  viewerMeta: { position: 'absolute', left: 18, right: 18, zIndex: 6, padding: 12, borderRadius: 14, backgroundColor: 'rgba(22,18,20,0.72)' },
  viewerUploader: { ...TYPOGRAPHY.labelMedium, color: '#FFFFFF' },
  viewerDate: { ...TYPOGRAPHY.caption, color: '#AFA6A9', marginTop: 3 },
  touchBlocker: { position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 20, backgroundColor: 'transparent' },
});
