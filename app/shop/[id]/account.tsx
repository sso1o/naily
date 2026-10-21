import { TYPOGRAPHY } from '@/constants/typography';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS, RADIUS } from '@/constants/colors';
import { designs, shops, users } from '@/data/mockData';

const INK = '#241B1E';

export default function ShopAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const shop = shops.find((item) => item.id === id);
  if (!shop) return <SafeAreaView style={styles.safe}><ScreenHeader title="샵 계정" /><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;
  const owner = users.find((user) => user.id === shop.ownerId);
  const shopDesigns = designs.filter((design) => design.availableShopIds.includes(shop.id));
  return <SafeAreaView style={styles.safe} edges={['top']}><ScreenHeader title="샵 계정" /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View style={styles.profile}><Image source={{ uri: owner?.avatarUrl ?? shop.imageUrl }} style={styles.avatar} /><View style={styles.nameRow}><Text style={styles.name}>{shop.name}</Text>{owner?.isShopVerified ? <Ionicons name="checkmark-circle" size={17} color={COLORS.primary} /> : null}</View><Text style={styles.handle}>@{shop.name.replace(/\s/g, '').toLowerCase()}</Text><Text style={styles.bio}>{shop.description}</Text><View style={styles.stats}><Stat value={shopDesigns.length} label="디자인" /><Stat value={shop.reviewCount} label="리뷰" /><Stat value={following ? 1241 : 1240} label="팔로워" /></View><View style={styles.actions}><Pressable onPress={() => setFollowing((value) => !value)} style={[styles.follow, following && styles.following]}><Text style={[styles.followText, following && styles.followingText]}>{following ? '팔로잉' : '팔로우'}</Text></Pressable><Pressable style={styles.message}><Text style={styles.messageText}>메시지</Text></Pressable></View></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>DESIGNS</Text><Text style={styles.sectionCount}>{shopDesigns.length}</Text></View><View style={styles.grid}>{shopDesigns.map((design) => <Pressable key={design.id} onPress={() => router.push(`/design/${design.id}`)} style={styles.tile}><Image source={{ uri: design.imageUrl }} style={styles.image} /></Pressable>)}</View></ScrollView></SafeAreaView>;
}

function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value.toLocaleString('ko-KR')}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#FFFFFF' }, content: { paddingBottom: 36 }, profile: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }, avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: COLORS.lightPink }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 }, name: { ...TYPOGRAPHY.titleLarge, color: INK, flexShrink: 1 }, handle: { ...TYPOGRAPHY.caption, color: '#9A8D91', marginTop: 3 }, bio: { ...TYPOGRAPHY.bodySmall, color: '#6F6468', textAlign: 'center', marginTop: 12 }, stats: { flexDirection: 'row', width: '100%', marginTop: 21 }, stat: { flex: 1, alignItems: 'center' }, statValue: { ...TYPOGRAPHY.labelLarge, color: INK }, statLabel: { ...TYPOGRAPHY.caption, color: '#91868A', marginTop: 3 }, actions: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 20 }, follow: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: INK, paddingVertical: 10 }, following: { backgroundColor: '#F5F1F2' }, followText: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF' }, followingText: { color: INK }, message: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E6DEE1', paddingVertical: 10 }, messageText: { ...TYPOGRAPHY.labelLarge, color: INK }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEE8EA' }, sectionTitle: { ...TYPOGRAPHY.titleMedium, letterSpacing: 1.3, color: INK }, sectionCount: { ...TYPOGRAPHY.caption, color: '#A09699' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 }, tile: { width: '33%', flexGrow: 1, maxWidth: '33.4%', aspectRatio: 1 }, image: { width: '100%', height: '100%', backgroundColor: COLORS.lightPink } });
