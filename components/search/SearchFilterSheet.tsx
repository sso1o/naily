import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { DESIGN_FILTER_OPTIONS, SHOP_FILTER_OPTIONS } from '@/data/searchData';
import { DesignFilters, EMPTY_DESIGN_FILTERS, EMPTY_SHOP_FILTERS, ShopFilters } from '@/types/search';

type Props = {
  visible: boolean;
  mode: 'design' | 'shop';
  designFilters: DesignFilters;
  shopFilters: ShopFilters;
  onClose: () => void;
  onApplyDesign: (value: DesignFilters) => void;
  onApplyShop: (value: ShopFilters) => void;
};

const COLOR_VALUES: Record<string, string> = {
  핑크: '#EAA8BB', 레드: '#C8525B', 화이트: '#F7F5F3', 블랙: '#2D292A', 누드: '#D8B49D',
  베이지: '#D9C4A3', 블루: '#799BCB', 퍼플: '#9A7BB8', 그린: '#7CA07D', 옐로우: '#E5C85E',
};

const cloneDesign = (value: DesignFilters): DesignFilters => ({
  ...value,
  styles: [...value.styles],
  types: [...value.types],
  colors: [...value.colors],
});

const cloneShop = (value: ShopFilters): ShopFilters => ({
  ...value,
  regions: [...value.regions],
  booking: [...value.booking],
});

const toggle = (items: string[], value: string) =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

function FilterSection({
  title,
  options,
  selected,
  onPress,
  colors = false,
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  onPress: (value: string) => void;
  colors?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              key={option}
              onPress={() => onPress(option)}
              style={[styles.chip, active && styles.activeChip]}
            >
              {colors ? <View style={[styles.colorDot, { backgroundColor: COLOR_VALUES[option] }, option === '화이트' && styles.whiteDot]} /> : null}
              <Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function SearchFilterSheet(props: Props) {
  const [designDraft, setDesignDraft] = useState(() => cloneDesign(props.designFilters));
  const [shopDraft, setShopDraft] = useState(() => cloneShop(props.shopFilters));

  useEffect(() => {
    if (!props.visible) return;
    setDesignDraft(cloneDesign(props.designFilters));
    setShopDraft(cloneShop(props.shopFilters));
  }, [props.designFilters, props.shopFilters, props.visible]);

  const isDesign = props.mode === 'design';
  const reset = () => {
    if (isDesign) setDesignDraft(cloneDesign(EMPTY_DESIGN_FILTERS));
    else setShopDraft(cloneShop(EMPTY_SHOP_FILTERS));
  };
  const apply = () => {
    if (isDesign) props.onApplyDesign(designDraft);
    else props.onApplyShop(shopDraft);
    props.onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={props.visible} onRequestClose={props.onClose}>
      <Pressable accessibilityLabel="필터 닫기" onPress={props.onClose} style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{isDesign ? '디자인 필터' : '네일샵 필터'}</Text>
          <Pressable accessibilityLabel="필터 닫기" hitSlop={8} onPress={props.onClose} style={styles.close}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.scrollContent}>
          {isDesign ? (
            <>
              <FilterSection title="스타일" options={DESIGN_FILTER_OPTIONS.styles} selected={designDraft.styles} onPress={(value) => setDesignDraft((current) => ({ ...current, styles: toggle(current.styles, value) }))} />
              <FilterSection title="디자인 유형" options={DESIGN_FILTER_OPTIONS.types} selected={designDraft.types} onPress={(value) => setDesignDraft((current) => ({ ...current, types: toggle(current.types, value) }))} />
              <FilterSection title="컬러" colors options={DESIGN_FILTER_OPTIONS.colors} selected={designDraft.colors} onPress={(value) => setDesignDraft((current) => ({ ...current, colors: toggle(current.colors, value) }))} />
              <FilterSection title="가격" options={DESIGN_FILTER_OPTIONS.prices} selected={designDraft.price ? [designDraft.price] : []} onPress={(value) => setDesignDraft((current) => ({ ...current, price: value === '전체' ? null : value }))} />
            </>
          ) : (
            <>
              <FilterSection title="지역" options={SHOP_FILTER_OPTIONS.regions} selected={shopDraft.regions} onPress={(value) => setShopDraft((current) => ({ ...current, regions: toggle(current.regions, value) }))} />
              <FilterSection title="거리" options={SHOP_FILTER_OPTIONS.distances} selected={shopDraft.distance ? [shopDraft.distance] : []} onPress={(value) => setShopDraft((current) => ({ ...current, distance: value === '전체' ? null : value }))} />
              <FilterSection title="가격" options={SHOP_FILTER_OPTIONS.prices} selected={shopDraft.price ? [shopDraft.price] : []} onPress={(value) => setShopDraft((current) => ({ ...current, price: value === '전체' ? null : value }))} />
              <FilterSection title="평점" options={SHOP_FILTER_OPTIONS.ratings} selected={shopDraft.rating ? [shopDraft.rating] : []} onPress={(value) => setShopDraft((current) => ({ ...current, rating: value === '전체' ? null : value }))} />
              <FilterSection title="예약" options={SHOP_FILTER_OPTIONS.bookings} selected={shopDraft.booking} onPress={(value) => setShopDraft((current) => ({ ...current, booking: toggle(current.booking, value) }))} />
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={reset} style={styles.resetButton}><Text style={styles.resetText}>초기화</Text></Pressable>
          <Pressable onPress={apply} style={styles.applyButton}><Text style={styles.applyText}>결과 보기</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(25,18,20,0.28)' },
  sheet: { maxHeight: '88%', marginTop: 'auto', borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, backgroundColor: COLORS.card },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, backgroundColor: '#D8D0D3' },
  header: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...TYPOGRAPHY.titleSmall, color: COLORS.text },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 10 },
  section: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  sectionTitle: { ...TYPOGRAPHY.labelLarge, color: COLORS.text, marginBottom: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 13, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card },
  activeChip: { borderColor: COLORS.primary, backgroundColor: COLORS.lightPink },
  chipText: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText },
  activeChipText: { fontWeight: FONT_WEIGHT.regular, color: '#96586A' },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 6 },
  whiteDot: { borderWidth: 1, borderColor: '#D8D1D3' },
  footer: { padding: 16, paddingBottom: 26, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, flexDirection: 'row', gap: 10 },
  resetButton: { width: 92, minHeight: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  resetText: { ...TYPOGRAPHY.labelLarge, color: COLORS.text },
  applyButton: { flex: 1, minHeight: 50, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  applyText: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF' },
});
