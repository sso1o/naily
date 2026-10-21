import { TYPOGRAPHY } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, RADIUS } from '@/constants/colors';
import { shops } from '@/data/mockData';

const INK = '#241B1E';

export default function ShopMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shop = shops.find((item) => item.id === id);
  if (!shop) return <SafeAreaView style={styles.safe}><ScreenHeader title="길찾기" /><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScreenHeader title="길찾기" />
    <View style={styles.map}>
      <View style={[styles.block, styles.blockOne]} /><View style={[styles.block, styles.blockTwo]} /><View style={[styles.block, styles.blockThree]} />
      <View style={styles.roadHorizontal} /><View style={styles.roadVertical} /><View style={styles.routeLine} />
      <View style={styles.startPin}><Ionicons name="navigate" size={15} color="#FFFFFF" /></View>
      <View style={styles.shopPin}><Ionicons name="location" size={23} color="#FFFFFF" /></View>
      <View style={styles.shopLabel}><Text style={styles.shopLabelText}>{shop.name}</Text></View>
      <View style={styles.mapControls}><Pressable style={styles.control}><Ionicons name="locate-outline" size={21} color={INK} /></Pressable><Pressable style={styles.control}><Ionicons name="add" size={22} color={INK} /></Pressable><Pressable style={styles.control}><Ionicons name="remove" size={22} color={INK} /></Pressable></View>
    </View>
    <View style={[styles.routeCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.handle} />
      <Text style={styles.routeTitle}>{shop.name}</Text><Text style={styles.address}>{shop.address}</Text>
      <View style={styles.routeSummary}><View style={styles.routeIcon}><Ionicons name="walk" size={21} color={COLORS.primary} /></View><View style={styles.routeText}><Text style={styles.routeTime}>도보 약 9분</Text><Text style={styles.routeDistance}>현재 위치에서 {shop.distance ?? '거리 계산 중'}</Text></View></View>
      <Pressable onPress={() => router.back()} style={styles.arriveButton}><Text style={styles.arriveText}>경로 안내 종료</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, map: { flex: 1, overflow: 'hidden', backgroundColor: '#ECEBE7' },
  block: { position: 'absolute', borderRadius: 8, backgroundColor: '#E1DFD9', borderWidth: 1, borderColor: '#D5D2CB' }, blockOne: { width: 150, height: 110, top: 42, left: 18, transform: [{ rotate: '-6deg' }] }, blockTwo: { width: 180, height: 130, top: 205, right: -28, transform: [{ rotate: '8deg' }] }, blockThree: { width: 140, height: 100, bottom: 65, left: 8 },
  roadHorizontal: { position: 'absolute', top: '43%', left: -30, width: '120%', height: 35, transform: [{ rotate: '-8deg' }], backgroundColor: '#FFFFFF' }, roadVertical: { position: 'absolute', left: '48%', top: -40, width: 31, height: '120%', transform: [{ rotate: '10deg' }], backgroundColor: '#FFFFFF' }, routeLine: { position: 'absolute', left: '51%', top: '28%', width: 5, height: '37%', borderRadius: 3, transform: [{ rotate: '10deg' }], backgroundColor: COLORS.primary },
  startPin: { position: 'absolute', left: '43%', bottom: '27%', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4D7FD1' }, shopPin: { position: 'absolute', left: '52%', top: '25%', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, shadowColor: '#7A4857', shadowOpacity: 0.28, shadowRadius: 9, elevation: 4 },
  shopLabel: { position: 'absolute', left: '41%', top: '34%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: '#FFFFFF' }, shopLabelText: { ...TYPOGRAPHY.labelMedium, color: INK },
  mapControls: { position: 'absolute', right: 14, top: 16, overflow: 'hidden', borderRadius: 15, backgroundColor: '#FFFFFF', shadowColor: '#33252A', shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 }, control: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ECE7E9' },
  routeCard: { paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#2B1B20', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 }, handle: { width: 38, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: '#D8D0D3', marginBottom: 17 }, routeTitle: { ...TYPOGRAPHY.titleSmall, color: INK }, address: { ...TYPOGRAPHY.bodySmall, color: '#7F7377', marginTop: 5 }, routeSummary: { flexDirection: 'row', alignItems: 'center', marginTop: 18, padding: 14, borderRadius: 18, backgroundColor: '#FAF4F6' }, routeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, routeText: { marginLeft: 12, flex: 1 }, routeTime: { ...TYPOGRAPHY.labelLarge, color: INK }, routeDistance: { ...TYPOGRAPHY.caption, color: '#7F7377', marginTop: 3 }, arriveButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: RADIUS.md, backgroundColor: INK, paddingVertical: 10 }, arriveText: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF' },
});
