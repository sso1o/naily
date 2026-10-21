import { StyleSheet, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING, GRID_COLUMN_GAP, GRID_ROW_GAP, SEARCH_DIVIDER_SPACING } from '@/constants/layout';

export default function SearchLoadingState({ type }: { type: 'design' | 'community' | 'shop' | 'all' }) {
  if (type === 'design' || type === 'all') {
    return (
      <View accessibilityLabel="검색 결과를 불러오는 중" style={styles.grid}>
        {[0, 1, 2, 3].map((item) => <View key={item} style={styles.design} />)}
      </View>
    );
  }
  return (
    <View accessibilityLabel="검색 결과를 불러오는 중" style={styles.list}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.row}>
          <View style={styles.copy}>
            <View style={styles.lineShort} />
            <View style={styles.line} />
            <View style={styles.line} />
          </View>
          <View style={styles.thumbnail} />
        </View>
      ))}
    </View>
  );
}

const placeholder = { backgroundColor: '#EEE9EB' } as const;
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_COLUMN_GAP, rowGap: GRID_ROW_GAP, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: SEARCH_DIVIDER_SPACING },
  design: { ...placeholder, width: '48%', aspectRatio: 0.82, borderRadius: RADIUS.md },
  list: { gap: 12, paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: SEARCH_DIVIDER_SPACING },
  row: { height: 116, padding: 14, borderRadius: RADIUS.md, flexDirection: 'row', backgroundColor: COLORS.card },
  copy: { flex: 1, justifyContent: 'center', gap: 9, paddingRight: 14 },
  line: { ...placeholder, height: 10, borderRadius: 5 },
  lineShort: { ...placeholder, height: 10, width: '48%', borderRadius: 5 },
  thumbnail: { ...placeholder, width: 82, height: 82, borderRadius: RADIUS.sm, alignSelf: 'center' },
});
