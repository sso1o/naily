import { TYPOGRAPHY } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import ReviewCard from '@/components/ReviewCard';
import ScreenHeader from '@/components/ScreenHeader';
import { reviews, shops } from '@/data/mockData';

export default function ShopReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shop = shops.find((item) => item.id === id);
  const items = reviews.filter((review) => review.shopId === id);
  if (!shop) return <SafeAreaView style={styles.safe}><ScreenHeader title="방문자 리뷰" /><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top']}><ScreenHeader title="방문자 리뷰" /><ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}><View style={styles.summary}><Text style={styles.score}>{shop.rating.toFixed(1)}</Text><View><View style={styles.stars}>{[0, 1, 2, 3, 4].map((star) => <Ionicons key={star} name="star" size={16} color="#F3A84B" />)}</View><Text style={styles.meta}>{shop.name} · 리뷰 {shop.reviewCount}개</Text></View></View><View style={styles.list}>{items.map((review) => <ReviewCard key={review.id} review={review} />)}</View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFFFFF' }, content: { padding: 16, paddingBottom: 36 }, summary: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, marginBottom: 14, borderRadius: 20, backgroundColor: '#282124' }, score: { ...TYPOGRAPHY.display, color: '#FFFFFF' }, stars: { flexDirection: 'row', gap: 2 }, meta: { ...TYPOGRAPHY.caption, color: '#C9BEC2', marginTop: 5 }, list: { gap: 10 } });
