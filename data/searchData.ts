import { SearchSuggestion } from '@/types/search';

export const POPULAR_SEARCHES = [
  '자석 네일',
  '시럽 네일',
  '여름 네일',
  '프렌치 네일',
  '성수 네일샵',
  '블러셔 네일',
  '웨딩 네일',
  '글리터 네일',
  '누드 네일',
  '강남 네일샵',
] as const;

export const RECOMMENDED_KEYWORDS = [
  '자석네일',
  '시럽네일',
  '블러셔네일',
  '프렌치네일',
  '웨딩네일',
  '심플네일',
  '여름네일',
] as const;

export const DESIGN_FILTER_OPTIONS = {
  styles: ['심플', '러블리', '키치', '힙', '화려한', '미니멀', '유니크'],
  types: ['시럽', '자석', '프렌치', '그라데이션', '글리터', '파츠', '캐릭터', '체크', '플라워'],
  colors: ['핑크', '레드', '화이트', '블랙', '누드', '베이지', '블루', '퍼플', '그린', '옐로우'],
  prices: ['전체', '3만원 이하', '3~5만원', '5~7만원', '7~10만원', '10만원 이상'],
} as const;

export const SHOP_FILTER_OPTIONS = {
  regions: ['성수', '합정', '강남', '홍대', '잠실'],
  distances: ['전체', '1km', '3km', '5km', '10km'],
  prices: ['전체', '3만원 이하', '3~5만원', '5~7만원', '7~10만원', '10만원 이상'],
  ratings: ['전체', '4.0 이상', '4.5 이상', '4.8 이상'],
  bookings: ['오늘 예약 가능', '내일 예약 가능'],
} as const;

export const DESIGN_SORTS = [
  ['popular', '인기순'],
  ['newest', '최신순'],
  ['likes', '좋아요순'],
  ['priceAsc', '가격 낮은순'],
  ['priceDesc', '가격 높은순'],
] as const;

export const COMMUNITY_SORTS = [
  ['relevance', '관련도순'],
  ['newest', '최신순'],
  ['popular', '인기순'],
  ['comments', '댓글 많은순'],
] as const;

export const SHOP_SORTS = [
  ['recommended', '추천순'],
  ['distance', '거리순'],
  ['rating', '평점순'],
  ['reviews', '리뷰 많은순'],
  ['priceAsc', '가격 낮은순'],
] as const;

export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { id: 's1', label: '자석 네일', category: 'design' },
  { id: 's2', label: '핑크 자석 네일', category: 'design' },
  { id: 's3', label: '실버 자석 네일', category: 'design' },
  { id: 's4', label: '자석네일 추천', category: 'community' },
  { id: 's5', label: '자석네일 전문샵', category: 'shop' },
  { id: 's6', label: '시럽 프렌치', category: 'design' },
  { id: 's7', label: '시럽네일 후기', category: 'community' },
  { id: 's8', label: '성수 네일샵', category: 'shop' },
  { id: 's9', label: '여름 휴가 네일', category: 'design' },
  { id: 's10', label: '웨딩 네일', category: 'design' },
];
