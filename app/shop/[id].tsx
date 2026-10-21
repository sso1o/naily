import { useFavorites } from '@/hooks/useFavorites';
import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import ReviewCard from '@/components/ReviewCard';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { reviews, shops, users } from '@/data/mockData';

const INK = '#241B1E';
const MUTED = '#7F7377';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [favorite, toggleFavorite] = useFavorites('shopIds', id);
  const [activeTab, setActiveTab] = useState('홈');
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const sectionOffsets = useRef<Record<string, number>>({});
  const bodyOffset = useRef(0);
  const shop = shops.find((item) => item.id === id);

  if (!shop) return <SafeAreaView style={styles.safe}><ScreenHeader title="네일샵" /><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;

  const owner = users.find((user) => user.id === shop.ownerId);
  const shopReviews = reviews.filter((review) => review.shopId === shop.id);
  const gallery = Array.from(new Set([shop.imageUrl, ...(shop.photos ?? [])].filter((url): url is string => Boolean(url))));
  const heroGallery = gallery.slice(0, 3);
  const monthlyArtAlbums = [...(shop.monthlyArtAlbums ?? [])].sort((a, b) => b.month.localeCompare(a.month));
  const now = new Date();
  const currentMonth = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthlyAlbum = monthlyArtAlbums.find((album) => album.month === currentMonth);
  const reserve = () => router.push({ pathname: '/booking', params: { shopId: shop.id } });
  const callShop = async () => {
    if (!shop.phone) return Alert.alert('전화번호가 등록되지 않았어요');
    const url = `tel:${shop.phone.replace(/[^0-9+]/g, '')}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert('전화 연결', shop.phone);
  };
  const openDirections = async () => {
    router.push(`/shop/${shop.id}/map`);
  };
  const moveToSection = (tab: string) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: Math.max(0, sectionOffsets.current[tab] ?? 0), animated: true });
  };
  const updateActiveTab = (y: number) => {
    const targets = ['리뷰', '가격'] as const;
    const next = targets.find((tab) => y + 100 >= (sectionOffsets.current[tab] ?? Number.POSITIVE_INFINITY)) ?? '홈';
    setActiveTab((current) => current === next ? current : next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator scrollEventThrottle={100} onScroll={(event) => updateActiveTab(event.nativeEvent.contentOffset.y)} contentContainerStyle={styles.scrollContent}>
        <Pressable accessibilityLabel={`샵 사진 ${gallery.length}장 보기`} onPress={() => router.push(`/shop/${shop.id}/gallery`)} style={styles.heroWrap}>
          {heroGallery[0] ? <Image source={{ uri: heroGallery[0] }} style={styles.heroMain} /> : <View style={styles.heroMain} />}
          <View style={styles.heroSide}>
            {heroGallery.slice(1, 3).map((image, index) => <Image key={image} source={{ uri: image }} style={[styles.heroSub, index === 0 && styles.heroSubGap]} />)}
          </View>
          <LinearGradient pointerEvents="none" colors={['rgba(28,18,21,0.36)', 'transparent', 'rgba(28,18,21,0.2)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroNav}>
            <RoundButton icon="chevron-back" label="뒤로 가기" onPress={() => router.back()} />
          </View>
          <View style={styles.photoCount}><Ionicons name="images-outline" size={14} color="#FFFFFF" /><Text style={styles.photoCountText}>사진 {gallery.length || 1}</Text></View>
        </Pressable>

        <View style={styles.profileCard}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>네일아트 · {shop.distance ?? '내 주변'}</Text>
            {owner?.isShopVerified ? <View style={styles.verified}><Ionicons name="checkmark-circle" size={13} color={COLORS.primary} /><Text style={styles.verifiedText}>인증샵</Text></View> : null}
          </View>
          <Text style={styles.title}>{shop.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#F3A84B" />
            <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
            <Text style={styles.reviewLink}>리뷰 {shop.reviewCount}개</Text>
            <View style={styles.dot} />
            <Text style={[styles.openState, !shop.isOpen && styles.closed]}>{shop.isOpen ? '영업 중' : '영업 종료'}</Text>
          </View>
          <Text style={styles.description}>{shop.description}</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="call-outline" label="전화" onPress={callShop} />
            <QuickAction icon="chatbubble-ellipses-outline" label="문의" onPress={() => router.push({ pathname: '/inquiries', params: { shopId: shop.id } })} />
            <QuickAction icon="person-circle-outline" label="샵 계정" onPress={() => router.push(`/shop/${shop.id}/account`)} />
            <QuickAction icon={favorite ? 'heart' : 'heart-outline'} label={favorite ? '저장됨' : '저장'} active={favorite} onPress={() => toggleFavorite()} />
          </View>
        </View>

        <View style={styles.tabBar}>
          {['홈', '가격', '리뷰'].map((tab) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} key={tab} onPress={() => moveToSection(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}><Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text></Pressable>)}
        </View>

        <View style={styles.body} onLayout={(event) => { bodyOffset.current = event.nativeEvent.layout.y; sectionOffsets.current.홈 = Math.max(0, bodyOffset.current - 53); }}>
          <InfoSection icon="location-outline" title="위치" trailing={shop.distance ?? ''}>
            <Text style={styles.infoText}>{shop.address}</Text>
            {shop.nearestStation ? <Text style={styles.infoHint}>{shop.nearestStation}</Text> : null}
            <Pressable accessibilityLabel="지도에서 길찾기" onPress={openDirections} style={styles.mapPreview}>
              <View style={styles.mapRoadOne} /><View style={styles.mapRoadTwo} />
              <View style={styles.mapPin}><Ionicons name="location" size={20} color="#FFFFFF" /></View>
              <Text style={styles.mapLabel}>{shop.name}</Text>
              <View style={styles.mapOpen}><Text style={styles.mapOpenText}>길찾기</Text><Ionicons name="chevron-forward" size={13} color={INK} /></View>
            </Pressable>
          </InfoSection>

          <InfoSection icon="time-outline" title="영업 정보" trailing={<Text style={[styles.openState, !shop.isOpen && styles.closed]}>{shop.isOpen ? '영업 중' : '영업 종료'}</Text>}>
            <View style={styles.hoursRow}><Text style={styles.hoursDay}>오늘</Text><Text style={styles.infoText}>{shop.businessHours ?? '10:00 - 21:00'}</Text></View>
            <Text style={styles.infoHint}>휴게시간 {shop.breakTime ?? '없음'} · {shop.closedDays ?? '연중무휴'}</Text>
            <Pressable onPress={() => setHoursExpanded((value) => !value)} style={styles.expandButton}><Text style={styles.expandText}>{hoursExpanded ? '접기' : '영업시간 전체보기'}</Text><Ionicons name={hoursExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={MUTED} /></Pressable>
            {hoursExpanded ? <View style={styles.weeklyHours}>{['월', '화', '수', '목', '금', '토'].map((day) => <View key={day} style={styles.weekRow}><Text style={styles.weekDay}>{day}</Text><Text style={styles.weekTime}>{shop.businessHours ?? '10:00 - 21:00'}</Text></View>)}<View style={styles.weekRow}><Text style={styles.weekDay}>일</Text><Text style={styles.closedDay}>휴무</Text></View></View> : null}
          </InfoSection>

          <InfoSection icon="information-circle-outline" title="샵 이용 안내">
            <Text style={styles.infoText}>{shop.notice ?? '예약 시간에 맞춰 방문해 주세요. 예약 변경은 샵으로 문의해 주세요.'}</Text>
            <View style={styles.amenities}>{(shop.amenities ?? shop.tags).map((item) => <View key={item} style={styles.amenity}><Ionicons name="checkmark" size={13} color="#9A6574" /><Text style={styles.amenityText}>{item}</Text></View>)}</View>
          </InfoSection>

          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}><Ionicons name="sparkles-outline" size={20} color={COLORS.primary} /></View>
            <View style={styles.noticeBody}><Text style={styles.noticeLabel}>첫 방문 혜택</Text><Text style={styles.noticeTitle}>{shop.benefit?.title ?? '신규 고객 젤네일 10% 할인'}</Text><Text style={styles.noticeHint}>{shop.benefit?.description ?? '예약 전 혜택 적용 여부를 확인해 주세요.'}</Text></View>
          </View>

          {currentMonthlyAlbum ? <View style={styles.monthlySection}>
            <SectionHeader title="이달의 아트" description={`${formatMonth(currentMonthlyAlbum.month)}에 새로 등록된 아트예요`} action="더보기" onAction={() => router.push(`/shop/${shop.id}/monthly-art`)} />
            <Pressable accessibilityLabel={`${currentMonthlyAlbum.month} 이달의 아트 앨범 보기`} onPress={() => router.push({ pathname: '/shop/[id]/monthly-art', params: { id: shop.id, month: currentMonthlyAlbum.month } })} style={styles.monthlyBoard}>
              {currentMonthlyAlbum.media[0]?.type === 'video' && !currentMonthlyAlbum.media[0].thumbnailUrl ? <View style={[styles.monthlyBoardImage, styles.monthlyVideoCover]}><Ionicons name="play" size={32} color="#FFFFFF" /></View> : <Image source={{ uri: currentMonthlyAlbum.media[0]?.type === 'video' ? currentMonthlyAlbum.media[0].thumbnailUrl : currentMonthlyAlbum.media[0]?.uri }} style={styles.monthlyBoardImage} />}
            </Pressable>
          </View> : null}

          <View onLayout={(event) => { sectionOffsets.current.가격 = bodyOffset.current + event.nativeEvent.layout.y - 53; }}><SectionHeader title="가격 정보" description="대표 시술 가격을 확인해 보세요" /></View>
          <View style={styles.priceCard}>
            {(shop.menus ?? [{ name: '기본 젤네일', detail: '케어 포함', price: shop.priceRange }]).map((menu, index, list) => <View key={menu.name}><PriceRow {...menu} onPress={reserve} />{index < list.length - 1 ? <View style={styles.priceDivider} /> : null}</View>)}
          </View>
          <Text style={styles.priceFootnote}>정확한 금액은 손톱 상태와 옵션에 따라 달라질 수 있어요.</Text>

          <View style={styles.reviewHeader} onLayout={(event) => { sectionOffsets.current.리뷰 = bodyOffset.current + event.nativeEvent.layout.y - 53; }}>
            <View><Text style={styles.sectionTitle}>방문자 리뷰 <Text style={styles.reviewAccent}>{shop.reviewCount}</Text></Text><Text style={styles.sectionDescription}>실제 방문 고객이 남긴 이야기예요</Text></View>
            <Pressable accessibilityLabel="리뷰 전체보기" onPress={() => router.push(`/shop/${shop.id}/reviews`)} hitSlop={8}><Text style={styles.sectionAction}>전체보기 ›</Text></Pressable>
          </View>
          <View style={styles.reviewSummary}>
            <Text style={styles.reviewScore}>{shop.rating.toFixed(1)}</Text>
            <View><View style={styles.stars}>{[0, 1, 2, 3, 4].map((star) => <Ionicons key={star} name="star" size={15} color="#F3A84B" />)}</View><Text style={styles.reviewSummaryText}>시술 만족도가 높아요</Text></View>
          </View>
          <View style={styles.list}>{shopReviews.length ? shopReviews.slice(0, 3).map((review) => <ReviewCard key={review.id} review={review} />) : <Text style={styles.emptyText}>아직 등록된 리뷰가 없어요.</Text>}</View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityLabel="채팅 문의" onPress={() => router.push({ pathname: '/inquiries', params: { shopId: shop.id } })} style={styles.chatButton}><Ionicons name="chatbubble-ellipses-outline" size={23} color={INK} /></Pressable>
        <PrimaryButton label="예약하기" onPress={reserve} style={styles.reserveButton} />
      </View>

    </SafeAreaView>
  );
}

function RoundButton({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} onPress={onPress} style={[styles.roundButton, active && styles.roundButtonActive]}><Ionicons name={icon} size={21} color={active ? '#FFFFFF' : INK} /></Pressable>;
}

function QuickAction({ icon, label, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} onPress={onPress} style={styles.quickAction}><View style={[styles.quickIcon, active && styles.quickIconActive]}><Ionicons name={icon} size={21} color={active ? '#FFFFFF' : INK} /></View><Text style={[styles.quickLabel, active && styles.quickLabelActive]}>{label}</Text></Pressable>;
}

function InfoSection({ icon, title, trailing, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return <View style={styles.infoSection}><View style={styles.infoHeader}><View style={styles.infoTitleRow}><Ionicons name={icon} size={20} color={INK} /><Text style={styles.infoTitle}>{title}</Text></View>{typeof trailing === 'string' ? <Text style={styles.infoTrailing}>{trailing}</Text> : trailing}</View>{children}</View>;
}

function SectionHeader({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionHeader}><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionDescription}>{description}</Text></View>{action ? <Pressable accessibilityLabel={`${title} ${action}`} onPress={onAction} disabled={!onAction} hitSlop={8}><Text style={styles.sectionAction}>{action} ›</Text></Pressable> : null}</View>;
}

function PriceRow({ name, detail, price, onPress }: { name: string; detail: string; price: string; onPress: () => void }) {
  return <Pressable accessibilityLabel={`${name} 예약하기`} onPress={onPress} style={styles.priceRow}><View style={styles.priceText}><Text style={styles.priceName}>{name}</Text><Text style={styles.priceDetail}>{detail}</Text></View><View style={styles.priceRight}><Text style={styles.priceValue}>{price}</Text><Ionicons name="chevron-forward" size={15} color="#B0A5A8" /></View></Pressable>;
}

function formatMonth(month: string) {
  const monthNumber = Number(month.split('.')[1]);
  return Number.isFinite(monthNumber) ? `${monthNumber}월` : month;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 28, backgroundColor: '#FFFFFF' },
  heroWrap: { height: 310, marginHorizontal: 12, borderRadius: 28, overflow: 'hidden', flexDirection: 'row', gap: 3, backgroundColor: COLORS.lightPink },
  heroMain: { flex: 2.05, height: '100%', backgroundColor: COLORS.lightPink },
  heroSide: { flex: 1, gap: 3 },
  heroSub: { flex: 1, width: '100%', backgroundColor: '#F1E7EA' },
  heroSubGap: { borderBottomWidth: 0 },
  heroNav: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.93)', shadowColor: '#33252A', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  roundButtonActive: { backgroundColor: COLORS.primary },
  photoCount: { position: 'absolute', right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.pill, backgroundColor: 'rgba(35,24,28,0.68)' },
  photoCountText: { ...TYPOGRAPHY.caption, color: '#FFFFFF' },
  profileCard: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 20 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  eyebrow: { ...TYPOGRAPHY.caption, color: '#9A777F' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: '#FAEEF2' },
  verifiedText: { ...TYPOGRAPHY.caption, color: '#A96477' },
  title: { ...TYPOGRAPHY.titleLarge, color: INK, marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  rating: { ...TYPOGRAPHY.caption, color: INK },
  reviewLink: { ...TYPOGRAPHY.caption, color: MUTED, textDecorationLine: 'underline' },
  dot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2, backgroundColor: '#C8BEC1' },
  openState: { ...TYPOGRAPHY.labelMedium, color: COLORS.success },
  closed: { color: MUTED },
  description: { ...TYPOGRAPHY.bodySmall, color: MUTED, marginTop: 12 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingHorizontal: 6 },
  quickAction: { width: 62, alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3F4' },
  quickIconActive: { backgroundColor: COLORS.primary },
  quickLabel: { ...TYPOGRAPHY.labelMedium, color: MUTED, marginTop: 7 },
  quickLabelActive: { fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  tabBar: { height: 53, flexDirection: 'row', paddingHorizontal: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0EAEC', backgroundColor: '#FFFFFF' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: INK },
  tabText: { ...TYPOGRAPHY.labelLarge, color: '#998E91' },
  activeTabText: { fontWeight: FONT_WEIGHT.regular, color: INK },
  body: { paddingHorizontal: SPACING.md },
  infoSection: { paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#F1ECEE' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoTitle: { ...TYPOGRAPHY.titleSmall, color: INK },
  infoTrailing: { ...TYPOGRAPHY.caption, color: MUTED },
  infoText: { ...TYPOGRAPHY.bodySmall, color: '#453D40' },
  infoHint: { ...TYPOGRAPHY.caption, color: MUTED, marginTop: 6 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  hoursDay: { ...TYPOGRAPHY.labelMedium, color: INK },
  mapPreview: { height: 106, marginTop: 15, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEECEA' },
  mapRoadOne: { position: 'absolute', width: '115%', height: 24, transform: [{ rotate: '-8deg' }], backgroundColor: '#FFFFFF' },
  mapRoadTwo: { position: 'absolute', width: 22, height: '130%', transform: [{ rotate: '18deg' }], backgroundColor: '#FFFFFF' },
  mapPin: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, zIndex: 2, shadowColor: '#7A4857', shadowOpacity: 0.24, shadowRadius: 8, elevation: 3 },
  mapLabel: { ...TYPOGRAPHY.caption, color: INK, marginTop: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, overflow: 'hidden', backgroundColor: '#FFFFFF', zIndex: 2 },
  mapOpen: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: '#FFFFFF' },
  mapOpenText: { ...TYPOGRAPHY.labelMedium, color: INK },
  expandButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingVertical: 4 },
  expandText: { ...TYPOGRAPHY.labelMedium, color: MUTED },
  weeklyHours: { gap: 9, marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: '#F8F5F6' },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekDay: { ...TYPOGRAPHY.caption, width: 32, color: MUTED },
  weekTime: { ...TYPOGRAPHY.caption, color: '#453D40' },
  closedDay: { ...TYPOGRAPHY.caption, color: COLORS.danger },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderRadius: RADIUS.pill, backgroundColor: '#F8F3F5' },
  amenityText: { ...TYPOGRAPHY.labelMedium, color: '#715E64' },
  noticeCard: { flexDirection: 'row', gap: 13, marginTop: 22, padding: 17, borderRadius: 20, backgroundColor: '#FBF2F5' },
  noticeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  noticeBody: { flex: 1 },
  noticeLabel: { ...TYPOGRAPHY.labelMedium, color: '#A46476' },
  noticeTitle: { ...TYPOGRAPHY.titleSmall, color: INK, marginTop: 3 },
  noticeHint: { ...TYPOGRAPHY.caption, color: MUTED, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 32, marginBottom: 14 },
  sectionHeading: { flex: 1, paddingRight: 12 },
  sectionTitle: { ...TYPOGRAPHY.titleMedium, color: INK },
  sectionDescription: { ...TYPOGRAPHY.bodySmall, color: MUTED, marginTop: 4 },
  sectionAction: { ...TYPOGRAPHY.labelLarge, color: MUTED, paddingBottom: 2 },
  monthlySection: { marginTop: 2 },
  monthlyBoard: { width: '100%', aspectRatio: 1, borderRadius: 22, overflow: 'hidden', backgroundColor: COLORS.lightPink },
  monthlyBoardImage: { width: '100%', height: '100%' },
  monthlyVideoCover: { alignItems: 'center', justifyContent: 'center', backgroundColor: INK },
  priceCard: { paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#EFE9EB', backgroundColor: '#FFFFFF' },
  priceRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceText: { flex: 1 },
  priceName: { ...TYPOGRAPHY.labelLarge, color: INK },
  priceDetail: { ...TYPOGRAPHY.caption, color: MUTED, marginTop: 4 },
  priceValue: { ...TYPOGRAPHY.labelLarge, color: INK, marginLeft: 12 },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceDivider: { height: 1, backgroundColor: '#F1ECEE' },
  priceFootnote: { ...TYPOGRAPHY.caption, color: MUTED, marginTop: 10, paddingHorizontal: 3 },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 34, marginBottom: 14 },
  reviewAccent: { color: COLORS.primary },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, marginBottom: 12, borderRadius: 20, backgroundColor: '#282124' },
  reviewScore: { ...TYPOGRAPHY.display, color: '#FFFFFF' },
  stars: { flexDirection: 'row', gap: 2 },
  reviewSummaryText: { ...TYPOGRAPHY.caption, color: '#C9BEC2', marginTop: 5 },
  list: { gap: 10 },
  emptyText: { ...TYPOGRAPHY.bodySmall, color: MUTED, textAlign: 'center', paddingVertical: 24 },
  bottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 11, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EAEC', shadowColor: '#2B1B20', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 8 },
  chatButton: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, borderColor: '#E7DFE2', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  reserveButton: { flex: 1, minHeight: 52, borderRadius: 18 },
});
