import { TYPOGRAPHY } from '@/constants/typography';
import { useMemo, useState } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import ReservationCard from '@/components/ReservationCard';
import ScreenHeader from '@/components/ScreenHeader';
import { useHorizontalGestureBoundary } from '@/components/navigation/PagerGestureContext';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { BOTTOM_NAV_CONTENT_INSET } from '@/constants/layout';
import { currentUser, designs, shops } from '@/data/mockData';
import { Reservation } from '@/types/models';
import { demoBookingDates, saveDemoReservation } from '@/services/reservationHub';

const times = ['11:00', '12:30', '14:00', '15:30', '17:00', '18:30'];

export default function ReservationScreen() {
  const params = useLocalSearchParams<{ designId?: string; shopId?: string }>();
  const router = useRouter();
  const horizontalGestureBoundary = useHorizontalGestureBoundary();
  const [dates] = useState(demoBookingDates);
  const [designId, setDesignId] = useState(() => designs.find((item) => item.id === params.designId)?.id ?? designs.find((item) => item.availableShopIds.includes(params.shopId ?? ''))?.id ?? designs[0]?.id ?? '');
  const [shopId, setShopId] = useState(() => designs.find(item => item.id === designId)?.availableShopIds.find(id => id === params.shopId) ?? designs.find(item => item.id === designId)?.availableShopIds[0] ?? '');
  const [date, setDate] = useState(dates[2].date);
  const [time, setTime] = useState('14:00');
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const summary: Reservation = useMemo(() => ({ id: 'new-reservation', userId: currentUser.id, designId, shopId, date, time, status: 'pending' }), [designId, shopId, date, time]);

  const confirm = () => {
    try { saveDemoReservation({ ...summary, id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    setConfirmed(true); } catch (error) { Alert.alert('예약 확인', (error as Error).message); setError((error as Error).message); return; }
    Alert.alert('데모 예약 저장', '이 기기에 저장되며, 샵에 실제 예약이 접수되지는 않습니다.');
  };

  if (!shops.some((item) => item.id === params.shopId) && !designs.some((item) => item.id === params.designId)) {
    return <Redirect href="/reservation" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>
        <ScreenHeader title="예약하기" />
        <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}>
          <Text style={styles.successText}>예약 과정 미리보기입니다. 실제 예약이 접수되지는 않습니다.</Text>
          {confirmed && (
            <View style={styles.success}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>데모 예약을 저장했어요</Text>
              <Text style={styles.successText}>예약 탭과 마이페이지에서 확인할 수 있어요. 앱을 다시 시작해도 유지됩니다.</Text>
            </View>
          )}

          {error ? <Text accessibilityRole="alert" style={styles.successText}>{error}</Text> : null}
          <Text style={styles.step}>01  디자인 선택</Text>
          <ScrollView {...horizontalGestureBoundary} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
            {designs.map((design) => (
              <Pressable key={design.id} onPress={() => { setDesignId(design.id); if (!design.availableShopIds.includes(shopId)) setShopId(design.availableShopIds[0]); setError(''); setConfirmed(false); }} style={[styles.design, designId === design.id && styles.selected]}>
                <Image source={{ uri: design.imageUrl }} style={styles.designImage} />
                <Text style={styles.designTitle} numberOfLines={1}>{design.title}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.step}>02  샵 선택</Text>
          <View style={styles.options}>
            {shops.filter(shop => designs.find(d => d.id === designId)?.availableShopIds.includes(shop.id)).map((shop) => (
              <Pressable key={shop.id} onPress={() => { setShopId(shop.id); setConfirmed(false); }} style={[styles.shopOption, shopId === shop.id && styles.selected]}>
                <View style={[styles.radio, shopId === shop.id && styles.radioSelected]} />
                <View style={styles.shopText}><Text style={styles.shopName}>{shop.name}</Text><Text style={styles.shopSub}>{shop.address} · ★ {shop.rating}</Text></View>
              </Pressable>
            ))}
          </View>

          <Text style={styles.step}>03  날짜 선택</Text>
          <View style={styles.dateRow}>
            {dates.map((item) => (
              <Pressable key={item.date} onPress={() => { setDate(item.date); setConfirmed(false); }} style={[styles.date, date === item.date && styles.dateSelected]}>
                <Text style={[styles.day, date === item.date && styles.white]}>{item.day}</Text>
                <Text style={[styles.dateNumber, date === item.date && styles.white]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.step}>04  시간 선택</Text>
          <View style={styles.timeGrid}>
            {times.map((item) => (
              <Pressable key={item} onPress={() => { setTime(item); setConfirmed(false); }} style={[styles.time, time === item && styles.timeSelected]}>
                <Text style={[styles.timeText, time === item && styles.white]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.step}>예약 요약</Text>
          <ReservationCard reservation={summary} />
          <PrimaryButton label={confirmed ? '마이페이지에서 확인하기' : '데모 예약 저장하기'} onPress={confirmed ? () => router.push('/mypage') : confirm} style={styles.confirm} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: BOTTOM_NAV_CONTENT_INSET },
  success: { backgroundColor: '#EAF6EF', borderRadius: RADIUS.lg, padding: 20, alignItems: 'center', marginBottom: 18 },
  successIcon: { width: 38, height: 38, borderRadius: 19, textAlign: 'center', lineHeight: 38, color: '#FFFFFF', backgroundColor: COLORS.success, fontSize: 18, fontWeight: '900' },
  successTitle: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, marginTop: 10 },
  successText: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, textAlign: 'center', marginTop: 6 },
  step: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, marginTop: 15, marginBottom: 12 },
  horizontal: { gap: 9, paddingBottom: 4 },
  design: { width: 116, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 6, borderWidth: 1.5, borderColor: 'transparent' },
  selected: { borderColor: COLORS.primary },
  designImage: { width: '100%', height: 100, borderRadius: RADIUS.sm },
  designTitle: { ...TYPOGRAPHY.labelMedium, color: COLORS.text, padding: 7, paddingBottom: 3 },
  options: { gap: 8 },
  shopOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'transparent', padding: 14 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.border, marginRight: 12 },
  radioSelected: { borderWidth: 5, borderColor: COLORS.primary },
  shopText: { flex: 1 },
  shopName: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  shopSub: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 5 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { width: '18%', alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.card, paddingVertical: 10 },
  dateSelected: { backgroundColor: COLORS.primary },
  day: { ...TYPOGRAPHY.caption, color: COLORS.subText },
  dateNumber: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 5 },
  white: { color: '#FFFFFF' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  time: { width: '31%', paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  timeSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeText: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  confirm: { marginTop: 15 },
});
