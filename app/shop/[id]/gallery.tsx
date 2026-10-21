import { TYPOGRAPHY } from '@/constants/typography';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import ZoomableGalleryImage from '@/components/ZoomableGalleryImage';
import { COLORS } from '@/constants/colors';
import { shops } from '@/data/mockData';

export default function ShopGalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const galleryRef = useRef<ScrollView>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [viewerHeight, setViewerHeight] = useState(0);
  const shop = shops.find((item) => item.id === id);
  const photos = shop ? Array.from(new Set([shop.imageUrl, ...(shop.photos ?? [])].filter((url): url is string => Boolean(url)))) : [];

  if (!shop) return <SafeAreaView style={styles.safe}><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;

  const selectPhoto = (index: number) => {
    setActivePhoto(index);
    galleryRef.current?.scrollTo({ x: width * index, animated: true });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="샵 상세로 돌아가기" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={24} color="#241B1E" /></Pressable>
        <View style={styles.headerText}><Text numberOfLines={1} style={styles.title}>{shop.name}</Text><Text style={styles.counter}>{activePhoto + 1} / {photos.length}</Text></View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView ref={galleryRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onLayout={(event) => setViewerHeight(event.nativeEvent.layout.height)} onMomentumScrollEnd={(event) => setActivePhoto(Math.round(event.nativeEvent.contentOffset.x / width))} style={styles.gallery}>
        {photos.map((photo) => <View key={photo} style={[styles.slide, { width }]}><ZoomableGalleryImage uri={photo} width={width} height={viewerHeight || undefined} /></View>)}
      </ScrollView>

      {photos.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailBar} contentContainerStyle={styles.thumbnails}>
        {photos.map((photo, index) => <Pressable key={photo} accessibilityLabel={`${index + 1}번째 사진 보기`} onPress={() => selectPhoto(index)} style={[styles.thumbnailWrap, activePhoto === index && styles.thumbnailActive]}><Image source={{ uri: photo }} style={styles.thumbnail} /></Pressable>)}
      </ScrollView> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ECE7E9', backgroundColor: '#FFFFFF' },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F4F5' },
  headerText: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  title: { ...TYPOGRAPHY.titleSmall, color: '#241B1E' },
  counter: { ...TYPOGRAPHY.caption, color: '#8E8387', marginTop: 2 },
  headerSpacer: { width: 42 },
  gallery: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  thumbnailBar: { flexGrow: 0, height: 62, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ECE7E9', backgroundColor: '#FFFFFF' },
  thumbnails: { alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 6 },
  thumbnailWrap: { width: 48, height: 48, padding: 2, borderWidth: 2, borderColor: 'transparent', borderRadius: 12 },
  thumbnailActive: { borderColor: COLORS.primary },
  thumbnail: { width: '100%', height: '100%', borderRadius: 10, backgroundColor: COLORS.lightPink },
});
