import { TYPOGRAPHY } from '@/constants/typography';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import ZoomableGalleryImage from '@/components/ZoomableGalleryImage';
import { shops } from '@/data/mockData';
import type { Shop } from '@/types/models';

const INK = '#241B1E';

export default function MonthlyArtViewerScreen() {
  const { id, month, index } = useLocalSearchParams<{ id: string; month: string; index?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const galleryRef = useRef<ScrollView>(null);
  const album = shops.find((shop) => shop.id === id)?.monthlyArtAlbums?.find((item) => item.month === month);
  const initialIndex = Math.min(Math.max(0, Number(index ?? 0)), Math.max(0, (album?.media.length ?? 1) - 1));
  const [activePhoto, setActivePhoto] = useState(initialIndex);
  const [viewerHeight, setViewerHeight] = useState(0);

  useEffect(() => { requestAnimationFrame(() => galleryRef.current?.scrollTo({ x: initialIndex * width, animated: false })); }, [initialIndex, width]);
  if (!album) return <SafeAreaView style={styles.safe}><EmptyState title="아트 사진을 찾을 수 없어요" /></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><Pressable accessibilityLabel="이달의 아트로 돌아가기" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={24} color={INK} /></Pressable><View style={styles.headerText}><Text style={styles.title}>{Number(album.month.split('.')[1])}월 이달의 아트</Text><Text style={styles.counter}>{activePhoto + 1} / {album.media.length}</Text></View><View style={styles.spacer} /></View>
    <ScrollView ref={galleryRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onLayout={(event) => setViewerHeight(event.nativeEvent.layout.height)} onMomentumScrollEnd={(event) => setActivePhoto(Math.round(event.nativeEvent.contentOffset.x / width))} style={styles.gallery}>{album.media.map((item, itemIndex) => <View key={item.id} style={[styles.slide, { width }]}><ArtMedia item={item} active={activePhoto === itemIndex} width={width} height={viewerHeight} /></View>)}</ScrollView>
    <View style={[styles.priceBar, { paddingBottom: Math.max(insets.bottom, 12) }]}><View><Text style={styles.priceLabel}>시술 가격</Text><Text style={styles.mediaType}>{album.media[activePhoto]?.type === 'video' ? 'VIDEO' : 'PHOTO'}</Text></View><Text style={styles.price}>{album.media[activePhoto]?.price}</Text></View>
  </SafeAreaView>;
}

type ArtItem = NonNullable<Shop['monthlyArtAlbums']>[number]['media'][number];

function ArtMedia({ item, active, width, height }: { item: ArtItem; active: boolean; width: number; height: number }) {
  if (item.type === 'image') return <ZoomableGalleryImage uri={item.uri} width={width} height={height || undefined} />;
  return <ArtVideo item={item} active={active} width={width} height={height} />;
}

function ArtVideo({ item, active, width, height }: { item: ArtItem; active: boolean; width: number; height: number }) {
  const player = useVideoPlayer(item.uri, (instance) => { instance.loop = true; });
  useEffect(() => { if (!active) player.pause(); }, [active, player]);
  return <View style={{ width, height: height || '100%', backgroundColor: '#111111' }}><VideoView player={player} nativeControls contentFit="contain" style={styles.video} /></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFFFFF' }, header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ECE7E9' }, back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F4F5' }, headerText: { flex: 1, alignItems: 'center' }, title: { ...TYPOGRAPHY.titleSmall, color: INK }, counter: { ...TYPOGRAPHY.caption, color: '#8E8387', marginTop: 2 }, spacer: { width: 42 }, gallery: { flex: 1 }, slide: { flex: 1, alignItems: 'center', justifyContent: 'center' }, video: { width: '100%', height: '100%' }, priceBar: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ECE7E9' }, priceLabel: { ...TYPOGRAPHY.labelMedium, color: INK }, mediaType: { ...TYPOGRAPHY.caption, color: '#8E8387', marginTop: 3 }, price: { ...TYPOGRAPHY.titleSmall, color: '#A45F73' } });
