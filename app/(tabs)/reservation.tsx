import { TYPOGRAPHY } from '@/constants/typography';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeImage from '@/components/home/HomeImage';
import { COLORS, RADIUS } from '@/constants/colors';
import { BOTTOM_NAV_CONTENT_INSET, CONTENT_MAX_WIDTH } from '@/constants/layout';
import { designs } from '@/data/mockData';
import { discoverShops, readReservationHub, ShopDiscovery } from '@/services/reservationHub';

const filters: { id: ShopDiscovery; label: string }[] = [
  { id: 'nearby', label: '가까운 순' }, { id: 'rating', label: '평점 높은 순' }, { id: 'open', label: '영업 중' },
];

export default function ReservationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shopId?: string; designId?: string }>();
  const list = useRef<ScrollView>(null);
  const [shopsY, setShopsY] = useState(0);
  const [filter, setFilter] = useState<ShopDiscovery>('nearby');
  const [data, setData] = useState(readReservationHub);
  useFocusEffect(useCallback(() => { setData(readReservationHub()); }, []));
  // Preserve old /reservation?shopId=... links without leaving the form in a tab.
  useEffect(() => {
    if (!params.shopId && !params.designId) return;
    const selection = { shopId: params.shopId, designId: params.designId };
    router.setParams({ shopId: undefined, designId: undefined });
    router.push({ pathname: '/booking', params: selection });
  }, [params.shopId, params.designId, router]);
  const recommendations = useMemo(() => discoverShops(data.shops, filter), [data.shops, filter]);
  const browse = () => list.current?.scrollTo({ y: shopsY, animated: true });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>예약</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/mypage')} style={styles.textButton}><Text style={styles.link}>예약 내역 ↗</Text></Pressable>
        </View>
        <View style={styles.hero}>
          <HomeImage uri={designs[0]?.imageUrl} fallbackLabel="NAILY" style={styles.heroImage} />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR NEXT NAIL</Text>
            <Text style={styles.heroTitle}>이번 네일,{ '\n' }어디서 받을까요?</Text>
            <Text style={styles.supporting}>취향에 맞는 공간에서 만나는 새로운 무드.</Text>
            <Pressable accessibilityRole="button" onPress={browse} style={styles.cta}><Text style={styles.ctaText}>샵 둘러보기</Text><Text style={styles.ctaText}>↗</Text></Pressable>
          </View>
        </View>
        <View onLayout={(event) => setShopsY(event.nativeEvent.layout.y)} style={styles.section}>
          <Text style={styles.sectionTitle}>취향이 머무는 샵</Text>
          <Text style={styles.supporting}>공간부터 아트까지, 나에게 맞는 곳을 찾아보세요.</Text>
          <View style={styles.filters}>
            {filters.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: filter === item.id }} onPress={() => setFilter(item.id)} style={[styles.chip, filter === item.id && styles.activeChip]}><Text style={[styles.chipText, filter === item.id && styles.activeChipText]}>{item.label}</Text></Pressable>)}
          </View>
          {recommendations.map((shop) => (
            <Pressable key={shop.id} accessibilityRole="button" accessibilityLabel={`${shop.name} 샵 상세 보기`} onPress={() => router.push(`/shop/${shop.id}`)} style={({ pressed }) => [styles.shop, pressed && styles.pressed]}>
              <HomeImage uri={shop.imageUrl} fallbackLabel="NAIL SHOP" style={styles.shopImage} />
              <View style={styles.shopCopy}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.meta}>{shop.address.split(' ').slice(0, 2).join(' ')}{shop.distance ? ` · ${shop.distance}` : ''}</Text>
                <Text style={styles.meta}>★ {shop.rating.toFixed(1)}</Text>
                <Text style={styles.price}>{shop.priceRange}</Text>
              </View>
            </Pressable>
          ))}
          {!recommendations.length && <Text style={styles.empty}>이 조건에 맞는 샵이 없어요. 다른 조건을 선택해 주세요.</Text>}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>나의 예약</Text><Pressable accessibilityRole="button" onPress={() => router.push('/mypage')} style={styles.textButton}><Text style={styles.link}>전체 내역 ↗</Text></Pressable></View>
          {data.upcoming.length ? data.upcoming.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.reservation}>
              <Text style={styles.eyebrow}>{item.status === 'pending' ? '확인 대기' : '예약 확정'}</Text>
              <Text style={styles.shopName}>{data.shops.find((shop) => shop.id === item.shopId)?.name ?? '네일샵'}</Text>
              <Text style={styles.meta}>{item.date} · {item.time}</Text>
            </View>
          )) : <View style={styles.reservation}><Text style={styles.supporting}>예정된 예약이 없어요.</Text><Pressable accessibilityRole="button" onPress={browse} style={styles.textButton}><Text style={styles.link}>샵 찾아보기 →</Text></Pressable></View>}
        </View>
        <Text style={styles.demo}>현재 샵과 예약 정보는 데모 데이터입니다.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: BOTTOM_NAV_CONTENT_INSET + 24, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  title: { ...TYPOGRAPHY.titleLarge, color: COLORS.text },
  textButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 },
  link: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  hero: { borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#F7F2F3' },
  heroImage: { width: '100%', aspectRatio: 1.65 },
  heroCopy: { padding: 22 },
  eyebrow: { ...TYPOGRAPHY.caption, color: '#986B79', letterSpacing: 1 },
  heroTitle: { ...TYPOGRAPHY.display, color: COLORS.text, marginTop: 10 },
  supporting: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 7 },
  cta: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: RADIUS.md, marginTop: 20, backgroundColor: COLORS.text },
  ctaText: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF' },
  section: { marginTop: 32 },
  sectionTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, marginBottom: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, borderRadius: RADIUS.pill, backgroundColor: '#F5F1F2', justifyContent: 'center' },
  activeChip: { backgroundColor: COLORS.text },
  chipText: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText },
  activeChipText: { color: '#FFFFFF' },
  shop: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  shopImage: { width: '32%', aspectRatio: 0.95, borderRadius: RADIUS.md },
  shopCopy: { flex: 1, minWidth: 0 },
  shopName: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 5 },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 5 },
  price: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 9 },
  pressed: { opacity: 0.7 },
  reservation: { padding: 18, backgroundColor: '#F8F5F6', borderRadius: RADIUS.md, marginTop: 10 },
  empty: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, paddingVertical: 24 },
  demo: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 28 },
});
