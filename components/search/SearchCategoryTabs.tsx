import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { SEARCH_CATEGORY_TABS_HEIGHT } from '@/constants/layout';
import { SearchCategory } from '@/types/search';

const TABS: Array<{ key: SearchCategory; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'design', label: '디자인' },
  { key: 'community', label: '커뮤니티' },
  { key: 'shop', label: '네일샵' },
];

export default function SearchCategoryTabs({
  value,
  onChange,
}: {
  value: SearchCategory;
  onChange: (value: SearchCategory) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {TABS.map((tab) => {
        const selected = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{tab.label}</Text>
            <View style={[styles.indicator, selected && styles.selectedIndicator]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  tab: {
    flex: 1,
    minHeight: SEARCH_CATEGORY_TABS_HEIGHT - StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  label: { ...TYPOGRAPHY.labelLarge, color: '#948A8D', paddingBottom: 11 },
  selectedLabel: { fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  indicator: { width: 20, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  selectedIndicator: { backgroundColor: COLORS.primary },
});
