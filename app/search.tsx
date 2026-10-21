import { TYPOGRAPHY } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CommunityResultCard from '@/components/CommunityResultCard';
import DesignResultCard from '@/components/DesignResultCard';
import EmptyState from '@/components/EmptyState';
import ShopResultCard from '@/components/ShopResultCard';
import SearchCategoryTabs from '@/components/search/SearchCategoryTabs';
import SearchInput from '@/components/search/SearchInput';
import SearchLoadingState from '@/components/search/SearchLoadingState';
import SearchSortSheet from '@/components/search/SearchSortSheet';
import { COLORS, RADIUS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING, CONTENT_MAX_WIDTH, GRID_COLUMN_GAP, GRID_ROW_GAP, SEARCH_DIVIDER_SPACING } from '@/constants/layout';
import { COMMUNITY_SORTS, DESIGN_SORTS, POPULAR_SEARCHES, RECOMMENDED_KEYWORDS, SHOP_SORTS } from '@/data/searchData';
import { loadRecentSearches, loadRecentSearchSaving, saveRecentSearches, saveRecentSearchSaving } from '@/services/recentSearches';
import { getSearchSession, saveSearchSession } from '@/services/searchSession';
import { filterAndSortDesigns, filterAndSortShops, getSearchSuggestions, normalizeSearchQuery, searchNaily, sortCommunity } from '@/services/searchService';
import { CommunitySort, DesignSort, EMPTY_DESIGN_FILTERS, EMPTY_SHOP_FILTERS, SearchCategory, SearchSuggestion, ShopSort } from '@/types/search';

const CATEGORY_LABELS: Record<Exclude<SearchCategory, 'all'>, string> = { design: '디자인', community: '커뮤니티', shop: '네일샵' };
const CATEGORY_ORDER: SearchCategory[] = ['all', 'design', 'community', 'shop'];
const SEARCH_BOTTOM_INSET = CONTENT_HORIZONTAL_PADDING;
const cloneDesignFilters = () => ({ ...EMPTY_DESIGN_FILTERS, styles: [], types: [], colors: [] });
const cloneShopFilters = () => ({ ...EMPTY_SHOP_FILTERS, regions: [], booking: [] });

function SectionTitle({ title, meta, action, onPress }: { title: string; meta?: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionTitleRow}>
    <View style={styles.sectionHeadingRow}><Text style={styles.sectionTitle}>{title}</Text>{meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}</View>
    {action && onPress ? <Pressable hitSlop={8} onPress={onPress} style={styles.moreButton}><Text style={styles.moreText}>{action}</Text><Ionicons name="chevron-forward" size={14} color="#8A737A" /></Pressable> : null}
  </View>;
}

function ResultHeader({ title, meta, right, first = false }: { title: string; meta: string; right: ReactNode; first?: boolean }) {
  return <View style={[styles.resultHeader, first && styles.resultHeaderFirst]}>
    <View style={styles.resultHeaderHeading}><Text style={styles.resultHeaderTitle}>{title}</Text><Text style={styles.resultHeaderMeta}>{meta}</Text></View>
    <View style={styles.resultHeaderRight}>{right}</View>
  </View>;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ query?: string; category?: string; reset?: string }>();
  const inputRef = useRef<TextInput>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height, width } = useWindowDimensions();
  const columnCount = width >= 680 ? 3 : 2;
  const popularColumnCount = width < 600 && height >= 780 ? 1 : 2;
  const availableWidth = Math.min(width, CONTENT_MAX_WIDTH) - CONTENT_HORIZONTAL_PADDING * 2;
  const resultCardWidth = (availableWidth - GRID_COLUMN_GAP * (columnCount - 1)) / columnCount;
  const bottomContentInset = SEARCH_BOTTOM_INSET + insets.bottom;
  const initialSession = useRef(getSearchSession()).current;

  const [query, setQuery] = useState(initialSession.query);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(initialSession.submittedQuery);
  const [category, setCategory] = useState<SearchCategory>(initialSession.category);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);
  const [recentSearchSaving, setRecentSearchSaving] = useState(loadRecentSearchSaving);
  const [designSort, setDesignSort] = useState<DesignSort>(initialSession.designSort);
  const [communitySort, setCommunitySort] = useState<CommunitySort>(initialSession.communitySort);
  const [shopSort, setShopSort] = useState<ShopSort>(initialSession.shopSort);
  const [sortSheet, setSortSheet] = useState<'design' | 'community' | 'shop' | null>(null);

  const pulseLoading = useCallback(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    setLoading(true);
    loadingTimerRef.current = setTimeout(() => setLoading(false), 320);
  }, []);

  const executeSearch = useCallback((rawValue: string, targetCategory: SearchCategory = 'all') => {
    const normalized = normalizeSearchQuery(rawValue);
    if (!normalized) return;
    setQuery(normalized); setSubmittedQuery(normalized); setCategory(targetCategory); setFocused(false);
    setDesignSort('popular'); setCommunitySort('relevance'); setShopSort('recommended');
    Keyboard.dismiss();
    if (recentSearchSaving) {
      setRecentSearches((current) => {
        const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, 10);
        saveRecentSearches(next); return next;
      });
    }
    pulseLoading();
  }, [pulseLoading, recentSearchSaving]);

  useEffect(() => {
    if (!params.reset) return;
    setQuery('');
    setSubmittedQuery(null);
    setCategory('all');
    setFocused(false);
    setLoading(false);
    setSuggestions([]);
    setDesignSort('popular');
    setCommunitySort('relevance');
    setShopSort('recommended');
    setSortSheet(null);
    Keyboard.dismiss();
  }, [params.reset]);
  useEffect(() => {
    if (!params.query) return;
    const requestedCategory = ['all', 'design', 'community', 'shop'].includes(params.category ?? '') ? params.category as SearchCategory : 'all';
    const normalizedParam = normalizeSearchQuery(params.query);
    const savedSession = getSearchSession();
    if (savedSession.submittedQuery === normalizedParam && savedSession.category === requestedCategory) return;
    executeSearch(params.query, requestedCategory);
  }, [executeSearch, params.category, params.query]);
  useEffect(() => { const timer = setTimeout(() => setSuggestions(getSearchSuggestions(query)), 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    saveSearchSession({ query, submittedQuery, category, designFilters: cloneDesignFilters(), shopFilters: cloneShopFilters(), designSort, communitySort, shopSort });
  }, [category, communitySort, designSort, query, shopSort, submittedQuery]);
  useEffect(() => () => { if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current); }, []);

  const baseResults = useMemo(() => searchNaily(submittedQuery ?? ''), [submittedQuery]);
  const designResults = useMemo(() => filterAndSortDesigns(baseResults.designs, cloneDesignFilters(), designSort), [baseResults.designs, designSort]);
  const communityResults = useMemo(() => sortCommunity(baseResults.community, communitySort), [baseResults.community, communitySort]);
  const shopResults = useMemo(() => filterAndSortShops(baseResults.shops, cloneShopFilters(), shopSort), [baseResults.shops, shopSort]);
  const totalResults = designResults.length + communityResults.length + shopResults.length;
  const firstResultCategory: Exclude<SearchCategory, 'all'> | null = designResults.length ? 'design' : communityResults.length ? 'community' : shopResults.length ? 'shop' : null;
  const lastResultCategory: Exclude<SearchCategory, 'all'> | null = shopResults.length ? 'shop' : communityResults.length ? 'community' : designResults.length ? 'design' : null;

  const removeRecent = (value: string) => setRecentSearches((current) => { const next = current.filter((item) => item !== value); saveRecentSearches(next); return next; });
  const clearRecent = () => { saveRecentSearches([]); setRecentSearches([]); };
  const toggleRecentSearchSaving = () => setRecentSearchSaving((current) => { const next = !current; saveRecentSearchSaving(next); return next; });
  const clearSearch = () => {
    setQuery('');
    setSubmittedQuery(null);
    setCategory('all');
    setSuggestions([]);
    setFocused(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const sortLabel = (options: ReadonlyArray<readonly [string, string]>, value: string) => options.find(([key]) => key === value)?.[1] ?? '';

  const swipeToCategory = useCallback((direction: -1 | 1) => {
    const currentIndex = CATEGORY_ORDER.indexOf(category);
    const nextCategory = CATEGORY_ORDER[currentIndex + direction];
    if (nextCategory) setCategory(nextCategory);
  }, [category]);

  const resultSwipeResponder = useMemo(() => PanResponder.create({
    // Leave edge-originated touches to the native back gesture.
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      (Platform.OS === 'web' || (gesture.x0 > 24 && gesture.x0 < width - 24)) &&
      Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) < 48) return;
      swipeToCategory(gesture.dx < 0 ? 1 : -1);
    },
  }), [swipeToCategory, width]);

  const renderRecentAndPopular = (inputMode = false) => <>
    <View style={styles.discoverySection}>
      <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>최근 검색어</Text><View style={styles.recentActions}>
        <Pressable hitSlop={8} onPress={clearRecent} style={styles.recentActionButton}><Text style={styles.recentActionText}>전체 삭제</Text></Pressable>
        <Text style={styles.recentActionDivider}>|</Text>
        <Pressable hitSlop={8} onPress={toggleRecentSearchSaving} style={styles.recentActionButton}><Text style={styles.recentActionText}>{recentSearchSaving ? '저장 끄기' : '저장 켜기'}</Text></Pressable>
      </View></View>
      {recentSearches.length ? <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentTrack}>{recentSearches.map((item) => <View key={item} style={styles.recentChip}>
        <Pressable onPress={() => executeSearch(item)} style={styles.recentLabelButton}><Text numberOfLines={1} style={styles.recentText}>{item}</Text></Pressable>
        <Pressable accessibilityLabel={`${item} 삭제`} hitSlop={6} onPress={() => removeRecent(item)} style={styles.recentRemove}><Ionicons name="close" size={14} color={COLORS.subText} /></Pressable>
      </View>)}</ScrollView> : null}
    </View>
    {!inputMode ? <View style={styles.discoverySection}><SectionTitle title="인기 검색어" /><View style={styles.rankingList}>{POPULAR_SEARCHES.map((item, index) => <Pressable key={item} onPress={() => executeSearch(item)} style={[styles.rankingRow, { width: popularColumnCount === 1 ? '100%' : '50%' }]}>
      <Text style={styles.rank}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.rankingText}>{item}</Text><Ionicons name="arrow-up-outline" size={14} color={index < 3 ? COLORS.primary : '#B5ACAF'} />
    </Pressable>)}</View></View> : null}
    {inputMode ? <View style={styles.discoverySection}><SectionTitle title="추천 검색어" /><ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keywordTrack}>{RECOMMENDED_KEYWORDS.map((item) => <Pressable key={item} onPress={() => executeSearch(item)} style={styles.keywordChip}><Text style={styles.keywordText}>#{item}</Text></Pressable>)}</ScrollView></View> : null}
  </>;

  const defaultContent = <ScrollView indicatorStyle="black" showsVerticalScrollIndicator scrollIndicatorInsets={{ right: 2 }} contentContainerStyle={styles.mainContent}>
    {renderRecentAndPopular()}
  </ScrollView>;

  const inputContent = <ScrollView keyboardShouldPersistTaps="handled" indicatorStyle="black" showsVerticalScrollIndicator scrollIndicatorInsets={{ right: 2 }} contentContainerStyle={[styles.inputScrollContent, { paddingBottom: bottomContentInset }]}>
    {query.length > 0 ? <View style={styles.suggestionsSection}><Text style={styles.suggestionHeading}>검색어 추천</Text>{suggestions.map((suggestion) => <Pressable key={suggestion.id} onPress={() => executeSearch(suggestion.label)} style={styles.suggestionRow}>
      <Ionicons name="search-outline" size={18} color={COLORS.subText} /><Text numberOfLines={1} style={styles.suggestionText}>{suggestion.label}</Text><Text style={styles.suggestionCategory}>{CATEGORY_LABELS[suggestion.category]}</Text>
    </Pressable>)}<Pressable onPress={() => executeSearch(query)} style={styles.searchAllRow}><Text numberOfLines={1} style={styles.searchAllText}>‘{query}’ 전체 검색</Text><Ionicons name="arrow-forward" size={18} color={COLORS.primary} /></Pressable></View> : renderRecentAndPopular(true)}
  </ScrollView>;

  const EmptyResults = () => <View style={styles.emptyWrap}>
    <EmptyState title="검색 결과가 없어요" message="다른 검색어를 사용해보세요." />
    <View style={styles.emptyKeywords}>{RECOMMENDED_KEYWORDS.slice(0, 3).map((item) => <Pressable key={item} onPress={() => executeSearch(item)} style={styles.keywordChip}><Text style={styles.keywordText}>#{item}</Text></Pressable>)}</View>
  </View>;

  const ResultToolbar = ({ type }: { type: Exclude<SearchCategory, 'all'> }) => {
    const count = type === 'design' ? designResults.length : type === 'community' ? communityResults.length : shopResults.length;
    const label = type === 'design' ? '디자인' : type === 'community' ? '커뮤니티' : '네일샵';
    return <ResultHeader first title={label} meta={`${count}개의 결과`} right={
      <Pressable onPress={() => setSortSheet(type)} style={styles.resultHeaderAction}><Text style={styles.resultHeaderActionText}>{type === 'design' ? sortLabel(DESIGN_SORTS, designSort) : type === 'community' ? sortLabel(COMMUNITY_SORTS, communitySort) : sortLabel(SHOP_SORTS, shopSort)}</Text></Pressable>
    } />;
  };

  const allResults = <ScrollView indicatorStyle="black" showsVerticalScrollIndicator scrollIndicatorInsets={{ right: 2 }} contentContainerStyle={[styles.flatContent, { paddingBottom: bottomContentInset }]}>
    {totalResults === 0 ? <EmptyResults /> : <>
      {designResults.length ? <View style={[styles.resultSection, lastResultCategory === 'design' && styles.lastResultSection]}><ResultHeader first={firstResultCategory === 'design'} title="디자인" meta={`${designResults.length}개의 결과`} right={<Pressable hitSlop={8} onPress={() => setCategory('design')} style={styles.resultHeaderAction}><Text style={styles.resultHeaderActionText}>더보기</Text></Pressable>} /><View style={styles.designGrid}>{designResults.slice(0, 4).map((design) => <View key={design.id} style={{ width: resultCardWidth }}><DesignResultCard separated design={design} onPress={() => router.push(`/design/${design.id}`)} /></View>)}</View></View> : null}
      {communityResults.length ? <View style={[styles.resultSection, lastResultCategory === 'community' && styles.lastResultSection]}><ResultHeader first={firstResultCategory === 'community'} title="커뮤니티" meta={`${communityResults.length}개의 결과`} right={<Pressable hitSlop={8} onPress={() => setCategory('community')} style={styles.resultHeaderAction}><Text style={styles.resultHeaderActionText}>더보기</Text></Pressable>} /><View style={styles.resultList}>{communityResults.slice(0, 3).map((post) => <CommunityResultCard key={post.id} post={post} onPress={() => router.push(`/post/${post.id}`)} />)}</View></View> : null}
      {shopResults.length ? <View style={[styles.resultSection, lastResultCategory === 'shop' && styles.lastResultSection]}><ResultHeader first={firstResultCategory === 'shop'} title="네일샵" meta={`${shopResults.length}개의 결과`} right={<Pressable hitSlop={8} onPress={() => setCategory('shop')} style={styles.resultHeaderAction}><Text style={styles.resultHeaderActionText}>더보기</Text></Pressable>} /><View style={styles.resultList}>{shopResults.slice(0, 3).map((shop) => <ShopResultCard key={shop.id} shop={shop} onPress={() => router.push(`/shop/${shop.id}`)} />)}</View></View> : null}
    </>}
  </ScrollView>;

  const categoryResults = category === 'design' ? <FlatList key={`design-${columnCount}`} data={designResults} numColumns={columnCount} keyExtractor={(item) => item.id} columnWrapperStyle={styles.columnWrapper} contentContainerStyle={[styles.flatContent, { paddingBottom: bottomContentInset }]} ItemSeparatorComponent={() => <View style={styles.designRowGap} />} ListHeaderComponent={<ResultToolbar type="design" />} ListEmptyComponent={<EmptyResults />} renderItem={({ item }) => <View style={{ width: resultCardWidth }}><DesignResultCard separated design={item} onPress={() => router.push(`/design/${item.id}`)} /></View>} indicatorStyle="black" showsVerticalScrollIndicator scrollIndicatorInsets={{ right: 2 }} />
    : category === 'community' ? <FlatList data={communityResults} keyExtractor={(item) => item.id} contentContainerStyle={[styles.flatContent, { paddingBottom: bottomContentInset }]} ItemSeparatorComponent={() => <View style={styles.listGap} />} ListHeaderComponent={<ResultToolbar type="community" />} ListEmptyComponent={<EmptyResults />} renderItem={({ item }) => <CommunityResultCard post={item} onPress={() => router.push(`/post/${item.id}`)} />} indicatorStyle="black" showsVerticalScrollIndicator scrollIndicatorInsets={{ right: 2 }} />
    : <FlatList data={shopResults} keyExtractor={(item) => item.id} contentContainerStyle={[styles.flatContent, { paddingBottom: bottomContentInset }]} ItemSeparatorComponent={() => <View style={styles.listGap} />} ListHeaderComponent={<ResultToolbar type="shop" />} ListEmptyComponent={<EmptyResults />} renderItem={({ item }) => <ShopResultCard shop={item} onPress={() => router.push(`/shop/${item.id}`)} />} indicatorStyle="black" showsVerticalScrollIndicator scrollIndicatorInsets={{ right: 2 }} />;

  return <SafeAreaView style={styles.safe} edges={['top']}><KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={[styles.screen, (focused || !submittedQuery) && styles.discoveryScreen]}>
    <View style={[styles.searchHeader, submittedQuery && !focused && styles.resultSearchHeader]}><Pressable accessibilityLabel="검색 닫기" hitSlop={8} onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={COLORS.text} /></Pressable><View style={styles.searchInputWrap}><SearchInput ref={inputRef} value={query} onBlur={() => setFocused(false)} onChangeText={setQuery} onClear={clearSearch} onFocus={() => setFocused(true)} onSubmit={() => executeSearch(query)} /></View></View>
    {focused ? inputContent : submittedQuery ? <View style={styles.resultsPager} {...resultSwipeResponder.panHandlers}><SearchCategoryTabs value={category} onChange={setCategory} />{loading ? <SearchLoadingState type={category} /> : category === 'all' ? allResults : categoryResults}</View> : defaultContent}
  </View></KeyboardAvoidingView>
    <SearchSortSheet visible={sortSheet === 'design'} title="디자인 정렬" options={DESIGN_SORTS} value={designSort} onClose={() => setSortSheet(null)} onChange={(value) => { setDesignSort(value); pulseLoading(); }} />
    <SearchSortSheet visible={sortSheet === 'community'} title="커뮤니티 정렬" options={COMMUNITY_SORTS} value={communitySort} onClose={() => setSortSheet(null)} onChange={(value) => { setCommunitySort(value); pulseLoading(); }} />
    <SearchSortSheet visible={sortSheet === 'shop'} title="네일샵 정렬" options={SHOP_SORTS} value={shopSort} onClose={() => setSortSheet(null)} onChange={(value) => { setShopSort(value); pulseLoading(); }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.card }, keyboardView: { flex: 1 }, screen: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', backgroundColor: COLORS.card }, discoveryScreen: { backgroundColor: COLORS.card },
  searchHeader: { paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: 12, paddingBottom: SEARCH_DIVIDER_SPACING, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card }, resultSearchHeader: { paddingBottom: 0 }, backButton: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center' }, searchInputWrap: { flex: 1 }, mainContent: { flexGrow: 1, gap: 24, paddingBottom: SEARCH_BOTTOM_INSET, backgroundColor: COLORS.card }, inputScrollContent: { flexGrow: 1, gap: 24, paddingBottom: SEARCH_BOTTOM_INSET, backgroundColor: COLORS.card }, discoverySection: { paddingHorizontal: CONTENT_HORIZONTAL_PADDING, backgroundColor: COLORS.card }, resultsPager: { flex: 1 },
  sectionTitleRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, sectionHeadingRow: { minWidth: 0, flexDirection: 'row', alignItems: 'baseline' }, sectionTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, letterSpacing: -0.4 }, sectionMeta: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginLeft: 7 }, moreButton: { minHeight: 32, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }, moreText: { ...TYPOGRAPHY.labelLarge, color: '#8A737A' },
  resultHeader: { minHeight: 40, paddingBottom: 8, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, resultHeaderFirst: { paddingTop: SEARCH_DIVIDER_SPACING }, resultHeaderHeading: { minWidth: 0, flexDirection: 'row', alignItems: 'baseline' }, resultHeaderTitle: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, letterSpacing: -0.4 }, resultHeaderMeta: { ...TYPOGRAPHY.caption, color: COLORS.subText, marginLeft: 7 }, resultHeaderRight: { marginLeft: 'auto', minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  resultHeaderAction: { minHeight: 32, paddingLeft: 14, alignItems: 'flex-end', justifyContent: 'center' }, resultHeaderActionText: { ...TYPOGRAPHY.labelLarge, color: COLORS.subText },
  recentActions: { flexDirection: 'row', alignItems: 'center' }, recentActionButton: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 4 }, recentActionText: { ...TYPOGRAPHY.labelMedium, color: '#8A737A' }, recentActionDivider: { ...TYPOGRAPHY.labelMedium, color: COLORS.border, marginHorizontal: 2 }, recentTrack: { gap: 8 }, recentChip: { minHeight: 38, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card }, recentLabelButton: { minHeight: 38, maxWidth: 150, justifyContent: 'center', paddingLeft: 13 }, recentText: { ...TYPOGRAPHY.labelMedium, color: COLORS.text }, recentRemove: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' },
  rankingList: { flexDirection: 'row', flexWrap: 'wrap' }, rankingRow: { minHeight: 44, paddingRight: 12, flexDirection: 'row', alignItems: 'center' }, rank: { ...TYPOGRAPHY.labelMedium, width: 28, color: COLORS.primary }, rankingText: { ...TYPOGRAPHY.bodyMedium, flex: 1, color: COLORS.text },
  keywordTrack: { gap: 8 }, keywordChip: { minHeight: 38, paddingHorizontal: 13, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightPink }, keywordText: { ...TYPOGRAPHY.labelMedium, color: '#96586A' }, designGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GRID_COLUMN_GAP, rowGap: GRID_ROW_GAP },
  suggestionsSection: { paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingTop: 18 }, suggestionHeading: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, marginBottom: 9 }, suggestionRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }, suggestionText: { ...TYPOGRAPHY.bodyMedium, flex: 1, color: COLORS.text }, suggestionCategory: { ...TYPOGRAPHY.caption, color: COLORS.subText }, searchAllRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, searchAllText: { ...TYPOGRAPHY.labelLarge, flex: 1, color: COLORS.primary },
  resultSection: { marginBottom: 30 }, lastResultSection: { marginBottom: 0 }, resultList: { gap: 10 },
  flatContent: { paddingHorizontal: CONTENT_HORIZONTAL_PADDING, paddingBottom: SEARCH_BOTTOM_INSET }, columnWrapper: { gap: GRID_COLUMN_GAP }, designRowGap: { height: GRID_ROW_GAP }, listGap: { height: 10 },
  emptyWrap: { alignItems: 'center', paddingBottom: 30 }, emptyKeywords: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 },
});
