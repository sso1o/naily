import { TYPOGRAPHY } from '@/constants/typography';
import { StyleSheet, Text, View } from 'react-native';
import { Reservation } from '@/types/models';
import { designs, shops } from '@/data/mockData';
import { COLORS, RADIUS } from '@/constants/colors';

const STATUS = {
  pending: '확인 대기',
  confirmed: '예약 확정',
  completed: '방문 완료',
  cancelled: '취소됨',
};

export default function ReservationCard({ reservation }: { reservation: Reservation }) {
  const shop = shops.find((item) => item.id === reservation.shopId);
  const design = designs.find((item) => item.id === reservation.designId);
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.shop}>{shop?.name ?? '선택한 네일숍'}</Text>
        <View style={styles.status}><Text style={styles.statusText}>{STATUS[reservation.status]}</Text></View>
      </View>
      <Text style={styles.design}>{design?.title ?? '디자인 상담 후 결정'}</Text>
      <Text style={styles.date}>{reservation.date} · {reservation.time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  shop: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, flexShrink: 1 },
  status: { backgroundColor: COLORS.lightPink, paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.pill },
  statusText: { ...TYPOGRAPHY.labelMedium, color: '#9A6474' },
  design: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 10 },
  date: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 6 },
});
