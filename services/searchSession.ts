import {
  CommunitySort,
  DesignFilters,
  DesignSort,
  EMPTY_DESIGN_FILTERS,
  EMPTY_SHOP_FILTERS,
  SearchCategory,
  ShopFilters,
  ShopSort,
} from '@/types/search';

export type SearchSession = {
  query: string;
  submittedQuery: string | null;
  category: SearchCategory;
  designFilters: DesignFilters;
  shopFilters: ShopFilters;
  designSort: DesignSort;
  communitySort: CommunitySort;
  shopSort: ShopSort;
};

const createEmptySearchSession = (): SearchSession => ({
  query: '',
  submittedQuery: null,
  category: 'all',
  designFilters: { ...EMPTY_DESIGN_FILTERS, styles: [], types: [], colors: [] },
  shopFilters: { ...EMPTY_SHOP_FILTERS, regions: [], booking: [] },
  designSort: 'popular',
  communitySort: 'relevance',
  shopSort: 'recommended',
});

let session: SearchSession = createEmptySearchSession();

export function getSearchSession(): SearchSession {
  return {
    ...session,
    designFilters: {
      ...session.designFilters,
      styles: [...session.designFilters.styles],
      types: [...session.designFilters.types],
      colors: [...session.designFilters.colors],
    },
    shopFilters: {
      ...session.shopFilters,
      regions: [...session.shopFilters.regions],
      booking: [...session.shopFilters.booking],
    },
  };
}

export function saveSearchSession(value: SearchSession) {
  session = value;
}

export function resetSearchSession() {
  session = createEmptySearchSession();
}
