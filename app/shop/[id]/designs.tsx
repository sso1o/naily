import { TYPOGRAPHY } from '@/constants/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DesignResultCard from '@/components/DesignResultCard';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import { GRID_COLUMN_GAP } from '@/constants/layout';
import { designs, shops } from '@/data/mockData';

export default function ShopDesignsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const shop = shops.find((item) => item.id === id);
  const items = designs.filter((design) => design.availableShopIds.includes(id));
  if (!shop) return <SafeAreaView style={styles.safe}><ScreenHeader title="대표 디자인" /><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top']}><ScreenHeader title="대표 디자인" /><ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.content}><Text style={styles.summary}>{shop.name} · {items.length}개</Text><View style={styles.grid}>{items.map((design) => <View key={design.id} style={styles.card}><DesignResultCard separated design={design} onPress={() => router.push(`/design/${design.id}`)} /></View>)}</View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFFFFF' }, content: { padding: 16, paddingBottom: 36 }, summary: { ...TYPOGRAPHY.bodySmall, color: '#7F7377', marginBottom: 16 }, grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_COLUMN_GAP, rowGap: 24 }, card: { width: '47%', flexGrow: 1, maxWidth: '48.5%' } });
