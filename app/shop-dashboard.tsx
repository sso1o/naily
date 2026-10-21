import { TYPOGRAPHY } from '@/constants/typography';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import { changeReservationStatus } from '@/services/reservationHub';
import ReservationCard from '@/components/ReservationCard';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { GRID_COLUMN_GAP, GRID_ROW_GAP } from '@/constants/layout';
import { currentUser, reservations, shops } from '@/data/mockData';

const tools = [
  { icon: '₩', title: '가격 메뉴 관리', text: '시술별 가격과 소요 시간' },
  { icon: '月', title: '이달의 아트 관리', text: '시즌 아트와 프로모션' },
  { icon: '◇', title: '대표 디자인 관리', text: '포트폴리오 순서와 태그' },
  { icon: '?', title: '고객 문의', text: '새 문의 3건' },
  { icon: '★', title: '리뷰 관리', text: '답변 대기 2건' },
  { icon: '!', title: '공지 작성', text: '휴무와 예약 안내' },
];

export default function ShopDashboardScreen() {
  const router = useRouter();
  const [, refresh] = useState(0);
  const [previewOwner, setPreviewOwner] = useState(false);
  const hasAccess = currentUser.role === 'shop_owner' || previewOwner;
  const shop = shops[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="샵 대시보드" />
      {!hasAccess ? (
        <View style={styles.guide}>
          <Text style={styles.guideIcon}>⌂</Text>
          <Text style={styles.guideTitle}>Naily에 샵을 등록하고{'\n'}고객과 더 가까워지세요</Text>
          <Text style={styles.guideText}>가격 메뉴, 이달의 아트, 예약 요청을{'\n'}한곳에서 관리할 수 있어요.</Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1  사업자 및 네일샵 정보 입력</Text>
            <Text style={styles.step}>2  운영팀의 간단한 인증 확인</Text>
            <Text style={styles.step}>3  샵 프로필 공개 및 예약 시작</Text>
          </View>
          <PrimaryButton label="로컬 사업자 화면 체험" onPress={() => setPreviewOwner(true)} style={styles.full} />
          <PrimaryButton label="대시보드 미리보기" variant="outline" onPress={() => setPreviewOwner(true)} style={styles.full} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}>
          <View style={styles.profile}>
            <Image source={{ uri: shop.imageUrl }} style={styles.shopImage} />
            <View style={styles.profileText}><Text style={styles.shopName}>{shop.name}</Text><Text style={styles.verified}>로컬 샵 관리 체험</Text><Text style={styles.shopStats}>★ {shop.rating} · 리뷰 {shop.reviewCount} · 샘플 샵</Text></View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{reservations.filter(r=>r.shopId===shop.id&&r.date===new Date().toLocaleDateString('sv-SE')).length}</Text><Text style={styles.metricLabel}>오늘 예약</Text></View>
            <View style={styles.divider} />
            <View style={styles.metric}><Text style={styles.metricValue}>—</Text><Text style={styles.metricLabel}>새 문의</Text></View>
            <View style={styles.divider} />
            <View style={styles.metric}><Text style={styles.metricValue}>—</Text><Text style={styles.metricLabel}>답변 대기</Text></View>
          </View>

          <Text style={styles.sectionTitle}>샵 관리</Text>
          <View style={styles.toolGrid}>
            {tools.map((tool) => (
              <Pressable key={tool.title} onPress={() => tool.title==='고객 문의' ? router.push({pathname:'/inquiries',params:{shopId:shop.id,owner:'1'}}) : router.push({pathname:'/shop-manage',params:{kind:tool.title,shopId:shop.id}})} style={styles.tool}>
                <View style={styles.toolIcon}><Text style={styles.toolIconText}>{tool.icon}</Text></View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolText}>{tool.text}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>예약 요청</Text><Pressable onPress={()=>router.push('/mypage')}><Text style={styles.more}>내 예약 보기 ›</Text></Pressable></View>
          <View style={styles.list}>{reservations.filter(r=>r.shopId===shop.id).map(reservation => <View key={reservation.id}><ReservationCard reservation={reservation}/>{(reservation.status==='pending'||reservation.status==='confirmed')&&<View style={{flexDirection:'row',gap:10}}><PrimaryButton label={reservation.status==='pending'?'예약 승인':'방문 완료'} onPress={()=>{changeReservationStatus(reservation.id,reservation.status==='pending'?'confirmed':'completed');refresh(n=>n+1);}}/><PrimaryButton label="예약 취소" variant="outline" onPress={()=>{changeReservationStatus(reservation.id,'cancelled');refresh(n=>n+1);}}/></View>}</View>)}</View>

          <Pressable onPress={() => router.push('/shop-community')} style={styles.communityBanner}>
            <View><Text style={styles.communityLabel}>SHOP OWNER LOUNGE</Text><Text style={styles.communityTitle}>원장님들의 진짜 운영 이야기</Text><Text style={styles.communityText}>샵 전용 커뮤니티에서 노하우를 나눠보세요.</Text></View>
            <Text style={styles.communityArrow}>›</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card },
  guide: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 28 },
  guideIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.lightPink, color: COLORS.primary, fontSize: 28, textAlign: 'center', lineHeight: 70 },
  guideTitle: { ...TYPOGRAPHY.titleLarge, color: COLORS.text, textAlign: 'center', marginTop: 18 },
  guideText: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, textAlign: 'center', marginTop: 10 },
  steps: { width: '100%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, gap: 11, marginVertical: 20 },
  step: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText },
  full: { width: '100%', marginTop: 10 },
  content: { padding: SPACING.md, paddingBottom: 40, backgroundColor: COLORS.background },
  profile: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, flexDirection: 'row' },
  shopImage: { width: 82, height: 82, borderRadius: RADIUS.md },
  profileText: { flex: 1, paddingLeft: 13, justifyContent: 'center' },
  shopName: { ...TYPOGRAPHY.titleMedium, color: COLORS.text },
  verified: { ...TYPOGRAPHY.labelMedium, color: COLORS.success, marginTop: 6 },
  shopStats: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginTop: 6 },
  metrics: { flexDirection: 'row', backgroundColor: '#2C292A', borderRadius: RADIUS.lg, paddingVertical: 18, marginTop: 12 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { ...TYPOGRAPHY.titleMedium, color: '#FFFFFF' },
  metricLabel: { ...TYPOGRAPHY.caption, color: '#BDB5B7', marginTop: 4 },
  divider: { width: 1, backgroundColor: '#514B4D' },
  sectionTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, marginTop: 25, marginBottom: 12 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_COLUMN_GAP, rowGap: GRID_ROW_GAP },
  tool: { width: '48%', backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 15 },
  toolIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.lightPink, alignItems: 'center', justifyContent: 'center' },
  toolIconText: { color: COLORS.primary, fontSize: 14, fontWeight: '900' },
  toolTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginTop: 10 },
  toolText: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  more: { ...TYPOGRAPHY.labelLarge, color: COLORS.subText },
  list: { gap: 9 },
  communityBanner: { backgroundColor: '#E8DED8', borderRadius: RADIUS.lg, padding: 18, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  communityLabel: { ...TYPOGRAPHY.caption, color: '#7C695D', letterSpacing: 1 },
  communityTitle: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, marginTop: 7 },
  communityText: { ...TYPOGRAPHY.bodySmall, color: '#80695B', marginTop: 5 },
  communityArrow: { color: '#7C695D', fontSize: 28 },
});
