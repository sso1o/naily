import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import { shops } from '@/data/mockData';

const INK = '#241B1E';
const MUTED = '#7F7377';

export default function MonthlyArtAlbumsScreen() {
  const { id, month } = useLocalSearchParams<{ id: string; month?: string }>();
  const router = useRouter();
  const shop = shops.find((item) => item.id === id);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  const albums = [...(shop?.monthlyArtAlbums ?? [])].sort((a, b) => b.month.localeCompare(a.month));
  const initialMonth = month ?? albums[0]?.month ?? currentMonth;
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draftYear, setDraftYear] = useState(Number(initialMonth.split('.')[0]));
  const [draftMonth, setDraftMonth] = useState(Number(initialMonth.split('.')[1]));
  const selected = albums.find((album) => album.month === selectedMonth);
  const years = Array.from({ length: 5 }, (_, index) => now.getFullYear() + 1 - index);

  if (!shop) return <SafeAreaView style={styles.safe}><ScreenHeader title="이달의 아트" /><EmptyState title="샵을 찾을 수 없어요" /></SafeAreaView>;

  const applyDate = () => {
    setSelectedMonth(`${draftYear}.${String(draftMonth).padStart(2, '0')}`);
    setPickerVisible(false);
  };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScreenHeader title="이달의 아트" />
    <View style={styles.toolbar}>
      <Pressable accessibilityLabel="연도와 월 선택" onPress={() => setPickerVisible(true)} style={styles.dateButton}><Text style={styles.dateText}>{selectedMonth.split('.')[0]}년 {Number(selectedMonth.split('.')[1])}월</Text><Ionicons name="chevron-down" size={15} color="#FFFFFF" /></Pressable>
      {selected ? <Text style={styles.pageCount}>{selected.media.length}개</Text> : null}
    </View>

    {selected ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
      {selected.media.map((item, index) => <Pressable key={item.id} accessibilityLabel={`${index + 1}번째 아트 크게 보기`} onPress={() => router.push({ pathname: '/shop/[id]/monthly-art-viewer', params: { id: shop.id, month: selected.month, index: String(index) } })} style={styles.card}>
        <View style={styles.thumbnailWrap}><Image source={{ uri: item.type === 'video' ? item.thumbnailUrl : item.uri }} style={styles.thumbnail} />{item.type === 'video' ? <View style={styles.playBadge}><Ionicons name="play" size={16} color="#FFFFFF" /></View> : null}</View>
        <View style={styles.cardBody}><Text numberOfLines={1} style={styles.cardTitle}>{Number(selected.month.split('.')[1])}월 아트 {String(index + 1).padStart(2, '0')}</Text><Text style={styles.cardPrice}>{item.price}</Text></View>
      </Pressable>)}
    </ScrollView> : <View style={styles.empty}><Ionicons name="images-outline" size={30} color="#BEB5B8" /><Text style={styles.emptyTitle}>등록된 아트가 없어요</Text><Text style={styles.emptyText}>다른 연도와 달을 선택해 보세요.</Text></View>}

    <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
      <Pressable style={styles.pickerBackdrop} onPress={() => setPickerVisible(false)} />
      <SafeAreaView style={styles.pickerSheet} edges={['bottom']}><View style={styles.pickerHandle} /><View style={styles.pickerHeader}><Pressable onPress={() => setPickerVisible(false)}><Text style={styles.pickerCancel}>취소</Text></Pressable><Text style={styles.pickerTitle}>연도와 달 선택</Text><Pressable onPress={applyDate}><Text style={styles.pickerDone}>완료</Text></Pressable></View><View style={styles.pickerColumns}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerOptions}>{years.map((year) => <Pressable key={year} onPress={() => setDraftYear(year)} style={[styles.pickerOption, draftYear === year && styles.pickerOptionActive]}><Text style={[styles.pickerOptionText, draftYear === year && styles.pickerOptionTextActive]}>{year}년</Text></Pressable>)}</ScrollView><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerOptions}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <Pressable key={value} onPress={() => setDraftMonth(value)} style={[styles.pickerOption, draftMonth === value && styles.pickerOptionActive]}><Text style={[styles.pickerOptionText, draftMonth === value && styles.pickerOptionTextActive]}>{value}월</Text></Pressable>)}</ScrollView></View></SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, toolbar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }, dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: INK }, dateText: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF' }, pageCount: { ...TYPOGRAPHY.caption, color: MUTED }, grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 22, paddingHorizontal: 16, paddingTop: 0, paddingBottom: 40 }, card: { width: '48%', flexGrow: 1, maxWidth: '48.6%', backgroundColor: 'transparent' }, thumbnailWrap: { width: '100%', aspectRatio: 1, overflow: 'hidden', borderRadius: 18, backgroundColor: '#F7EEF1' }, thumbnail: { width: '100%', height: '100%' }, playBadge: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35,24,28,0.75)' }, cardBody: { paddingTop: 9, paddingHorizontal: 1 }, cardTitle: { ...TYPOGRAPHY.labelLarge, color: INK }, cardPrice: { ...TYPOGRAPHY.labelLarge, color: MUTED, marginTop: 4 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F6F7' }, emptyTitle: { ...TYPOGRAPHY.titleSmall, color: INK, marginTop: 10 }, emptyText: { ...TYPOGRAPHY.bodySmall, color: MUTED, marginTop: 4 }, pickerBackdrop: { flex: 1, backgroundColor: 'rgba(30,22,25,0.34)' }, pickerSheet: { height: 390, paddingTop: 9, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FCFAFA' }, pickerHandle: { width: 38, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: '#D8D0D3' }, pickerHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ECE7E9' }, pickerCancel: { ...TYPOGRAPHY.labelLarge, color: MUTED }, pickerTitle: { ...TYPOGRAPHY.titleSmall, color: INK }, pickerDone: { ...TYPOGRAPHY.labelLarge, color: '#A66376' }, pickerColumns: { flex: 1, flexDirection: 'row', gap: 10, padding: 14 }, pickerOptions: { gap: 6, paddingBottom: 14 }, pickerOption: { height: 44, minWidth: 140, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, pickerOptionActive: { backgroundColor: INK }, pickerOptionText: { ...TYPOGRAPHY.bodyMedium, color: MUTED }, pickerOptionTextActive: { fontWeight: FONT_WEIGHT.bold, color: '#FFFFFF' },
});
