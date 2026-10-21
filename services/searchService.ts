import { allPosts, designs, shops } from '@/data/mockData';
import { SEARCH_SUGGESTIONS } from '@/data/searchData';
import {
  CommunitySort,
  DesignFilters,
  DesignSort,
  SearchResults,
  SearchSuggestion,
  ShopFilters,
  ShopSort,
} from '@/types/search';

export const normalizeSearchQuery = (value: string) =>
  value.replace(/#/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

const compact = (value: string) => value.toLocaleLowerCase('ko-KR').replace(/\s/g, '');
const matches = (query: string, fields: Array<string | undefined>) => {
  const haystack = compact(fields.filter(Boolean).join(' '));
  const tokens = query
    .toLocaleLowerCase('ko-KR')
    .split(/\s+/)
    .map((token) => compact(token).replace(/네일샵|네일숍|네일|샵|숍/g, ''))
    .filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every((token) => haystack.includes(token));
};

const priceValue = (value: string) => Number(value.replace(/[^0-9]/g, '').slice(0, 5)) || 0;

const matchesPrice = (value: string, selected: string | null) => {
  if (!selected || selected === '전체') return true;
  const price = priceValue(value);
  if (selected === '3만원 이하') return price <= 30000;
  if (selected === '3~5만원') return price >= 30000 && price <= 50000;
  if (selected === '5~7만원') return price >= 50000 && price <= 70000;
  if (selected === '7~10만원') return price >= 70000 && price <= 100000;
  return price >= 100000;
};

const distanceValue = (value?: string) => Number.parseFloat(value ?? '999');

export function getSearchSuggestions(query: string): SearchSuggestion[] {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return [];
  const found = SEARCH_SUGGESTIONS.filter((item) => matches(normalized, [item.label]));
  if (found.length) return found.slice(0, 5);
  return [
    { id: `query-design-${normalized}`, label: `${normalized} 네일`, category: 'design' },
    { id: `query-community-${normalized}`, label: `${normalized} 추천`, category: 'community' },
    { id: `query-shop-${normalized}`, label: `${normalized} 전문샵`, category: 'shop' },
  ];
}

export function searchNaily(query: string): SearchResults {
  const normalized = normalizeSearchQuery(query);
  return {
    designs: designs.filter((item) => matches(normalized, [item.title, item.description, ...item.tags])),
    community: allPosts.filter((item) => matches(normalized, [item.title, item.preview, item.authorName, ...item.tags])),
    shops: shops.filter((item) => matches(normalized, [item.name, item.description, item.address, ...item.tags])),
  };
}

export function filterAndSortDesigns(
  items: SearchResults['designs'],
  filters: DesignFilters,
  sort: DesignSort,
) {
  const filtered = items.filter((item) => {
    const tags = compact(item.tags.join(' '));
    const matchesGroup = (selections: string[]) =>
      !selections.length || selections.some((selection) => tags.includes(compact(selection)));
    return matchesGroup(filters.styles)
      && matchesGroup(filters.types)
      && matchesGroup(filters.colors)
      && matchesPrice(item.estimatedPrice, filters.price);
  });
  return [...filtered].sort((a, b) => {
    if (sort === 'likes') return b.likeCount - a.likeCount;
    if (sort === 'newest') return b.id.localeCompare(a.id);
    if (sort === 'priceAsc') return priceValue(a.estimatedPrice) - priceValue(b.estimatedPrice);
    if (sort === 'priceDesc') return priceValue(b.estimatedPrice) - priceValue(a.estimatedPrice);
    return b.savedCount - a.savedCount;
  });
}

export function sortCommunity(items: SearchResults['community'], sort: CommunitySort) {
  return [...items].sort((a, b) => {
    if (sort === 'comments') return b.commentCount - a.commentCount;
    if (sort === 'popular') return b.likeCount - a.likeCount;
    if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
    return 0;
  });
}

export function filterAndSortShops(items: SearchResults['shops'], filters: ShopFilters, sort: ShopSort) {
  const filtered = items.filter((item) => {
    const regionMatch = !filters.regions.length || filters.regions.some((region) => item.address.includes(region));
    const distance = distanceValue(item.distance);
    const distanceMatch = !filters.distance || filters.distance === '전체' || distance <= Number.parseFloat(filters.distance);
    const rating = filters.rating ? Number.parseFloat(filters.rating) : 0;
    const ratingMatch = !filters.rating || filters.rating === '전체' || item.rating >= rating;
    const bookingMatch = !filters.booking.length || item.isOpen;
    return regionMatch && distanceMatch && ratingMatch && bookingMatch && matchesPrice(item.priceRange, filters.price);
  });
  return [...filtered].sort((a, b) => {
    if (sort === 'distance') return distanceValue(a.distance) - distanceValue(b.distance);
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'reviews') return b.reviewCount - a.reviewCount;
    if (sort === 'priceAsc') return priceValue(a.priceRange) - priceValue(b.priceRange);
    return Number(b.isOpen) - Number(a.isOpen) || b.rating - a.rating;
  });
}
