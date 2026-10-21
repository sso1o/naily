import { CommunityPost, Design, Shop } from '@/types/models';

export type SearchCategory = 'all' | 'design' | 'community' | 'shop';
export type DesignSort = 'popular' | 'newest' | 'likes' | 'priceAsc' | 'priceDesc';
export type CommunitySort = 'relevance' | 'newest' | 'popular' | 'comments';
export type ShopSort = 'recommended' | 'distance' | 'rating' | 'reviews' | 'priceAsc';

export type DesignFilters = {
  styles: string[];
  types: string[];
  colors: string[];
  price: string | null;
};

export type ShopFilters = {
  regions: string[];
  distance: string | null;
  price: string | null;
  rating: string | null;
  booking: string[];
};

export type SearchSuggestion = {
  id: string;
  label: string;
  category: Exclude<SearchCategory, 'all'>;
};

export type SearchResults = {
  designs: Design[];
  community: CommunityPost[];
  shops: Shop[];
};

export const EMPTY_DESIGN_FILTERS: DesignFilters = {
  styles: [],
  types: [],
  colors: [],
  price: null,
};

export const EMPTY_SHOP_FILTERS: ShopFilters = {
  regions: [],
  distance: null,
  price: null,
  rating: null,
  booking: [],
};
