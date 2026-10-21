import { TYPOGRAPHY } from '@/constants/typography';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DesignResultCard from '@/components/DesignResultCard';
import ReservationCard from '@/components/ReservationCard';
import RoleBadge from '@/components/RoleBadge';
import { useHorizontalGestureBoundary } from '@/components/navigation/PagerGestureContext';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { GRID_COLUMN_GAP } from '@/constants/layout';
import { BOTTOM_NAV_CONTENT_INSET } from '@/constants/layout';
import { changeReservationStatus } from '@/services/reservationHub';
import { currentUser, preferences, designs, publicPosts, reservations, shops } from '@/data/mockData';

const menu = [
  { icon: '▤', title: '내가 쓴 글', value: '›' },
  { icon: '♡', title: '좋아요한 글', value: '›' },
  { icon: '▣', title: '저장한 글', value: '›' },
  { icon: '⌂', title: '관심 샵', value: '›' },
  { icon: '⚙', title: '설정', value: '›' },
];

export default function MyPageScreen() {
  const router = useRouter();
  const horizontalGestureBoundary = useHorizontalGestureBoundary();
  const [myReservations, setMyReservations] = useState(() => reservations.filter((item) => item.userId === currentUser.id));
  useFocusEffect(useCallback(() => {
    setMyReservations(reservations.filter((item) => item.userId === currentUser.id));
  }, []));
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>마이 네일리</Text>
            <Pressable onPress={() => router.push('/settings')}><Text style={styles.settings}>⚙</Text></Pressable>
          </View>
          <View style={styles.profile}>
            {currentUser.avatarUrl ? <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
            <View style={styles.profileText}><Text style={styles.nickname}>{currentUser.nickname}</Text><RoleBadge role={currentUser.role} verified={currentUser.isShopVerified} /></View>
            <Pressable onPress={() => router.push('/settings')} style={styles.edit}><Text style={styles.editText}>프로필 편집</Text></Pressable>
          </View>

          <Pressable onPress={() => router.push('/shop-dashboard')} style={styles.shopBanner}>
            <View><Text style={styles.shopBannerLabel}>FOR SHOP OWNERS</Text><Text style={styles.shopBannerTitle}>네일샵을 운영하고 계신가요?</Text><Text style={styles.shopBannerText}>샵 등록과 예약 관리를 시작해보세요.</Text></View>
            <Text style={styles.shopBannerArrow}>›</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>예약 내역</Text>
          <View style={styles.list}>{myReservations.map((reservation) => <View key={reservation.id}><ReservationCard reservation={reservation}/>{['pending','confirmed'].includes(reservation.status)&&<Pressable accessibilityRole="button" onPress={()=>{changeReservationStatus(reservation.id,'cancelled');setMyReservations(reservations.filter(r=>r.userId===currentUser.id));}} style={{padding:12}}><Text>예약 취소</Text></Pressable>}</View>)}</View>

          {!myReservations.length&&<Text style={{padding:16}}>예약 내역이 없습니다.</Text>}<Text style={styles.sectionTitle}>저장한 디자인</Text>{!preferences.designIds.length&&<Text style={{padding:16}}>디자인의 하트를 눌러 저장해주세요.</Text>}
          <ScrollView {...horizontalGestureBoundary} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
            {designs.filter(d => preferences.designIds.includes(d.id)).map((design) => <DesignResultCard key={design.id} design={design} compact onPress={() => router.push(`/design/${design.id}`)} />)}
          </ScrollView>

          <Text style={styles.sectionTitle}>내 활동</Text>
          <View style={styles.menu}>
            {menu.map((item) => (
              <Pressable key={item.title} onPress={() => router.push({ pathname: '/activity', params: { kind: item.title } })} style={styles.menuItem}>
                <Text style={styles.menuIcon}>{item.icon}</Text><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuValue}>{item.value}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.lightPink },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: BOTTOM_NAV_CONTENT_INSET },
  header: { backgroundColor: COLORS.lightPink, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { ...TYPOGRAPHY.titleLarge, color: COLORS.text },
  settings: { color: COLORS.text, fontSize: 20 },
  profile: { backgroundColor: COLORS.lightPink, paddingHorizontal: SPACING.md, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.card, marginRight: 14 },
  profileText: { flex: 1 },
  nickname: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, marginBottom: 8 },
  edit: { borderRadius: RADIUS.pill, backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 8 },
  editText: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText },
  shopBanner: { margin: SPACING.md, backgroundColor: '#2C292A', borderRadius: RADIUS.lg, padding: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shopBannerLabel: { ...TYPOGRAPHY.caption, color: COLORS.secondary, letterSpacing: 1.2 },
  shopBannerTitle: { ...TYPOGRAPHY.titleSmall, color: '#FFFFFF', marginTop: 7 },
  shopBannerText: { ...TYPOGRAPHY.bodySmall, color: '#BDB5B7', marginTop: 5 },
  shopBannerArrow: { color: COLORS.secondary, fontSize: 29 },
  sectionTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, marginHorizontal: SPACING.md, marginTop: 16, marginBottom: 12 },
  list: { gap: 9, paddingHorizontal: SPACING.md },
  horizontal: { gap: GRID_COLUMN_GAP, paddingHorizontal: SPACING.md },
  menu: { backgroundColor: COLORS.card, marginHorizontal: SPACING.md, borderRadius: RADIUS.md, paddingHorizontal: 15 },
  menuItem: { height: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { color: COLORS.primary, fontSize: 17, width: 31 },
  menuTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, flex: 1 },
  menuValue: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText },
});
