import { TYPOGRAPHY } from '@/constants/typography';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import ShopCommunityCard from '@/components/ShopCommunityCard';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';
import { currentUser, shopPosts } from '@/data/mockData';

const categories = ['전체', '운영팁', '재료추천', '고객응대', '가격고민', '노쇼', '마케팅', '시즌아트'];

export default function ShopCommunityScreen() {
  const router = useRouter();
  const [previewOwner, setPreviewOwner] = useState(false);
  const [category, setCategory] = useState('전체');
  const hasAccess = currentUser.role === 'shop_owner' && currentUser.isShopVerified || previewOwner;
  const visiblePosts = category === '전체' ? shopPosts : shopPosts.filter((post) => post.category === category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="샵 원장님 라운지" />
      {!hasAccess ? (
        <View style={styles.guide}>
          <View style={styles.lock}><Text style={styles.lockText}>N</Text></View>
          <Text style={styles.guideEyebrow}>VERIFIED SHOP ONLY</Text>
          <Text style={styles.guideTitle}>인증된 샵 사용자만{'\n'}입장할 수 있어요</Text>
          <Text style={styles.guideText}>운영 노하우, 재료 추천, 고객 응대 고민을{'\n'}안전하게 나누는 원장님 전용 공간이에요.</Text>
          <PrimaryButton label="샵 사용자 등록 안내" onPress={() => router.push('/shop-dashboard')} style={styles.guideButton} />
          <PrimaryButton label="원장님 화면 미리보기" variant="outline" onPress={() => setPreviewOwner(true)} style={styles.guideButton} />
        </View>
      ) : (
        <View style={styles.screen}>
          <View style={styles.intro}><Text style={styles.introLabel}>PRIVATE LOUNGE</Text><Text style={styles.introTitle}>오늘의 샵 이야기를 나눠보세요</Text><Text style={styles.introText}>인증된 원장님끼리만 글을 볼 수 있어요.</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}>
            {visiblePosts.map((post) => <ShopCommunityCard key={post.id} post={post} onPress={() => router.push(`/post/${post.id}`)} />)}
          </ScrollView>
          <Pressable onPress={() => router.push({ pathname: '/write', params: { mode: 'shop' } })} style={styles.fab}><Text style={styles.fabText}>＋</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card },
  screen: { flex: 1, backgroundColor: '#F7F3F0' },
  guide: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: 30 },
  lock: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#7C695D', alignItems: 'center', justifyContent: 'center' },
  lockText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  guideEyebrow: { ...TYPOGRAPHY.caption, color: '#8A6D5C', letterSpacing: 1.5, marginTop: 20 },
  guideTitle: { ...TYPOGRAPHY.titleLarge, color: COLORS.text, textAlign: 'center', marginTop: 9 },
  guideText: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, textAlign: 'center', marginTop: 12 },
  guideButton: { width: '100%', marginTop: 11 },
  intro: { backgroundColor: '#E8DED8', padding: 20 },
  introLabel: { ...TYPOGRAPHY.caption, color: '#80695B', letterSpacing: 1.2 },
  introTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, marginTop: 7 },
  introText: { ...TYPOGRAPHY.bodySmall, color: '#80695B', marginTop: 6 },
  categories: { gap: 8, padding: 13, backgroundColor: COLORS.card },
  category: { borderRadius: RADIUS.pill, backgroundColor: '#F7F3F0', paddingHorizontal: 14, paddingVertical: 8 },
  categoryActive: { backgroundColor: '#7C695D' },
  categoryText: { ...TYPOGRAPHY.labelLarge, color: '#8A6D5C' },
  categoryTextActive: { color: '#FFFFFF' },
  content: { padding: SPACING.md, gap: 11, paddingBottom: 90 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: '#7C695D', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabText: { color: '#FFFFFF', fontSize: 29 },
});
