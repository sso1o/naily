import { magazineArticles } from '@/data/homeData';
export { prepareMedia } from '@/services/mediaStorage';
import { readStore, writeStore } from '@/services/storage';
import {
  Comment,
  CommunityPost,
  Coupon,
  Design,
  Reservation,
  Review,
  Shop,
  User,
} from '@/types/models';

const IMG = {
  nail1: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
  nail2: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80',
  nail3: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=80',
  nail4: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80',
  shop1: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1000&q=80',
  shop2: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
  shopInterior1: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80',
  shopInterior2: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80',
  shopInterior3: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80',
  shopInterior4: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
  avatar1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  avatar2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

const DECORATED_PEACH_IMAGE = {
  uri: IMG.nail1,
  aspectRatio: 4 / 3,
  decorations: [
    {
      id: 'post-1-gradient',
      type: 'gradient' as const,
      x: 0,
      y: 0.52,
      width: 1,
      height: 0.48,
      gradientColors: [
        'rgba(20, 12, 15, 0)',
        'rgba(20, 12, 15, 0.72)',
      ] as const,
    },
    {
      id: 'post-1-title',
      type: 'text' as const,
      role: 'title' as const,
      x: 0.08,
      y: 0.68,
      width: 0.84,
      height: 0.18,
      text: '복숭아빛 한 방울',
      fontSize: 28,
      fontWeight: '800' as const,
      color: '#FFFFFF',
      textAlign: 'left' as const,
      maxLines: 2,
    },
  ],
};

export const users: User[] = [
  { id: 'user-1', role: 'general', nickname: '핑크라떼', avatarUrl: IMG.avatar1 },
  { id: 'owner-1', role: 'shop_owner', nickname: '모브 원장', avatarUrl: IMG.avatar2, isShopVerified: true },
  { id: 'owner-2', role: 'shop_owner', nickname: '온유네일', isShopVerified: true },
  { id: 'admin-1', role: 'admin', nickname: '네일리 운영자' },
];

// Change this id to owner-1 to preview verified shop-owner screens.
export const currentUser: User = users[0];
export const mockShopOwner: User = users[1];

export const shops: Shop[] = [
  {
    id: 'shop-1',
    ownerId: 'owner-1',
    name: '모브 네일 성수',
    description: '차분한 컬러와 섬세한 드로잉을 잘하는 1:1 프라이빗 네일숍입니다.',
    address: '서울 성동구 연무장길 21',
    distance: '0.7km',
    rating: 4.9,
    reviewCount: 128,
    isOpen: true,
    priceRange: '₩45,000 ~ ₩110,000',
    imageUrl: IMG.shop1,
    photos: [IMG.shop1, IMG.shopInterior1, IMG.shopInterior2, IMG.shopInterior3, IMG.shopInterior4],
    tags: ['드로잉', '시럽', '자석', '야간예약'],
    phone: '02-466-0721',
    nearestStation: '성수역 3번 출구에서 420m',
    businessHours: '10:00 - 21:00',
    breakTime: '13:00 - 14:00',
    closedDays: '매주 일요일',
    notice: '예약 시간 10분 전부터 입장 가능해요. 손톱 상태에 따라 시술 시간이 달라질 수 있습니다.',
    amenities: ['1:1 시술', '무선 인터넷', '반려동물 동반', '야간 예약'],
    benefit: { title: '신규 고객 젤네일 10% 할인', description: '첫 방문 고객 · 젤 시술 5만원 이상' },
    menus: [
      { name: '원 컬러 젤', detail: '케어 포함 · 60분', price: '45,000원' },
      { name: '이달의 아트', detail: '디자인 선택 · 90분', price: '79,000원' },
      { name: '타샵 젤 제거', detail: '시술 동시 진행 시', price: '10,000원' },
    ],
    monthlyArtAlbums: [
      { id: 'shop-1-art-07', month: '2026.07', media: [{ id: 's1-07-1', type: 'image', uri: IMG.nail1, aspectRatio: 1, price: '69,000원' }, { id: 's1-07-2', type: 'image', uri: IMG.nail2, aspectRatio: 1, price: '79,000원' }] },
      { id: 'shop-1-art-08', month: '2026.08', media: [{ id: 's1-08-1', type: 'image', uri: IMG.nail3, aspectRatio: 1, price: '75,000원' }, { id: 's1-08-2', type: 'image', uri: IMG.nail1, aspectRatio: 1, price: '82,000원' }, { id: 's1-08-3', type: 'image', uri: IMG.nail2, aspectRatio: 1, price: '89,000원' }] },
      { id: 'shop-1-art-09', month: '2026.09', media: [{ id: 's1-09-1', type: 'image', uri: IMG.nail4, aspectRatio: 1, price: '79,000원' }, { id: 's1-09-2', type: 'video', uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnailUrl: IMG.nail3, aspectRatio: 1, price: '85,000원' }, { id: 's1-09-3', type: 'image', uri: IMG.nail1, aspectRatio: 1, price: '92,000원' }] },
    ],
  },
  {
    id: 'shop-2',
    ownerId: 'owner-2',
    name: '온유 네일 합정',
    description: '키치하고 사랑스러운 파츠 아트 전문. 꼼꼼한 케어까지 함께해요.',
    address: '서울 마포구 독막로 8길 12',
    distance: '1.4km',
    rating: 4.8,
    reviewCount: 94,
    isOpen: false,
    priceRange: '₩50,000 ~ ₩130,000',
    imageUrl: IMG.shop2,
    photos: [IMG.shop2, IMG.shopInterior3, IMG.shopInterior4, IMG.shopInterior1],
    tags: ['파츠', '리본', '러블리', '주차가능'],
    phone: '02-337-0812', nearestStation: '합정역 7번 출구에서 280m', businessHours: '11:00 - 20:00', breakTime: '없음', closedDays: '매주 월요일',
    amenities: ['예약제', '주차 가능', '무선 인터넷'], benefit: { title: '첫 방문 케어 무료', description: '아트 시술 예약 고객' },
    menus: [{ name: '원 컬러 젤', detail: '케어 포함 · 60분', price: '50,000원' }, { name: '시그니처 파츠 아트', detail: '파츠 포함 · 100분', price: '95,000원' }, { name: '타샵 젤 제거', detail: '시술 동시 진행 시', price: '10,000원' }],
    monthlyArtAlbums: [{ id: 'shop-2-art-08', month: '2026.08', media: [{ id: 's2-08-1', type: 'image', uri: IMG.nail2, aspectRatio: 1, price: '88,000원' }, { id: 's2-08-2', type: 'image', uri: IMG.nail1, aspectRatio: 1, price: '95,000원' }] }, { id: 'shop-2-art-09', month: '2026.09', media: [{ id: 's2-09-1', type: 'image', uri: IMG.nail4, aspectRatio: 1, price: '90,000원' }, { id: 's2-09-2', type: 'image', uri: IMG.nail2, aspectRatio: 1, price: '105,000원' }] }],
  },
  {
    id: 'shop-3',
    ownerId: 'owner-2',
    name: '누드블룸 네일',
    description: '손톤에 맞춘 누드 컬러와 오피스 네일을 제안해 드려요.',
    address: '서울 강남구 봉은사로 44길 9',
    distance: '2.1km',
    rating: 4.7,
    reviewCount: 76,
    isOpen: true,
    priceRange: '₩40,000 ~ ₩95,000',
    imageUrl: IMG.shop1,
    photos: [IMG.shop1, IMG.shopInterior2, IMG.shopInterior4, IMG.shopInterior1],
    tags: ['오피스', '누드톤', '심플', '당일예약'],
    phone: '02-555-4409', nearestStation: '선정릉역 2번 출구에서 510m', businessHours: '10:30 - 20:30', breakTime: '14:00 - 15:00', closedDays: '격주 화요일',
    amenities: ['1:1 시술', '당일 예약', '무선 인터넷'], benefit: { title: '첫 방문 5천원 할인', description: '네일리 예약 고객' },
    menus: [{ name: '누드 원 컬러', detail: '맞춤 컬러 상담 · 60분', price: '40,000원' }, { name: '오피스 아트', detail: '디자인 선택 · 80분', price: '65,000원' }, { name: '타샵 젤 제거', detail: '시술 동시 진행 시', price: '10,000원' }],
    monthlyArtAlbums: [{ id: 'shop-3-art-08', month: '2026.08', media: [{ id: 's3-08-1', type: 'image', uri: IMG.nail1, aspectRatio: 1, price: '62,000원' }, { id: 's3-08-2', type: 'image', uri: IMG.nail4, aspectRatio: 1, price: '68,000원' }] }, { id: 'shop-3-art-09', month: '2026.09', media: [{ id: 's3-09-1', type: 'image', uri: IMG.nail3, aspectRatio: 1, price: '65,000원' }, { id: 's3-09-2', type: 'image', uri: IMG.nail1, aspectRatio: 1, price: '72,000원' }] }],
  },
];

export const designs: Design[] = [
  {
    id: 'design-1',
    title: '복숭아 시럽 프렌치',
    description: '맑은 복숭아빛 베이스에 얇은 프렌치 라인을 더한 데일리 디자인.',
    imageUrl: IMG.nail1,
    photos: [
      { id: 'design-1-photo-1', imageUrl: IMG.nail1, uploaderName: '모브 네일 성수', uploaderType: 'shop', uploaderAvatarUrl: IMG.shop1, likeCount: 328, uploadedAt: '2026.09.12', postId: 'post-1' },
      { id: 'design-1-photo-2', imageUrl: IMG.nail2, uploaderName: '핑크라떼', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar1, likeCount: 214, uploadedAt: '2026.09.10', postId: 'post-1' },
      { id: 'design-1-photo-3', imageUrl: IMG.nail3, uploaderName: '네일조아', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar2, likeCount: 176, uploadedAt: '2026.09.08', postId: 'post-3' },
      { id: 'design-1-photo-4', imageUrl: IMG.nail4, uploaderName: '소담', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar1, likeCount: 93, uploadedAt: '2026.09.04', postId: 'post-3' },
      { id: 'design-1-photo-5', imageUrl: IMG.nail1, uploaderName: '온유 네일 합정', uploaderType: 'shop', uploaderAvatarUrl: IMG.shop2, likeCount: 71, uploadedAt: '2026.08.29', postId: 'post-1' },
      { id: 'design-1-photo-6', imageUrl: IMG.nail2, uploaderName: '윤슬', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar2, likeCount: 42, uploadedAt: '2026.08.21', postId: 'post-2' },
    ],
    tags: ['시럽', '프렌치', '데일리', '심플', '핑크'],
    estimatedPrice: '₩65,000 ~ ₩85,000',
    savedCount: 842,
    likeCount: 1204,
    availableShopIds: ['shop-1', 'shop-3'],
  },
  {
    id: 'design-2',
    title: '발레코어 리본',
    description: '진주와 리본 파츠로 완성한 로맨틱 발레코어 무드.',
    imageUrl: IMG.nail2,
    photos: [
      { id: 'design-2-photo-1', imageUrl: IMG.nail2, uploaderName: '온유 네일 합정', uploaderType: 'shop', uploaderAvatarUrl: IMG.shop2, uploadedAt: '2026.09.11', postId: 'post-2' },
      { id: 'design-2-photo-2', imageUrl: IMG.nail4, uploaderName: '소담', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar1, uploadedAt: '2026.09.02', postId: 'post-2' },
    ],
    tags: ['리본', '파츠', '발레코어', '러블리', '핑크'],
    estimatedPrice: '₩85,000 ~ ₩120,000',
    savedCount: 618,
    likeCount: 989,
    availableShopIds: ['shop-2'],
  },
  {
    id: 'design-3',
    title: '오로라 글리터',
    description: '빛에 따라 은은하게 달라지는 여름 오로라 글리터.',
    imageUrl: IMG.nail3,
    photos: [
      { id: 'design-3-photo-1', imageUrl: IMG.nail3, uploaderName: '모브 네일 성수', uploaderType: 'shop', uploaderAvatarUrl: IMG.shop1, uploadedAt: '2026.09.09', postId: 'post-3' },
      { id: 'design-3-photo-2', imageUrl: IMG.nail1, uploaderName: '윤슬', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar2, uploadedAt: '2026.08.30', postId: 'post-3' },
    ],
    tags: ['글리터', '오로라', '여름', '자석', '화려한', '퍼플'],
    estimatedPrice: '₩70,000 ~ ₩95,000',
    savedCount: 504,
    likeCount: 734,
    availableShopIds: ['shop-1', 'shop-2'],
  },
  {
    id: 'design-4',
    title: '레몬 드로잉',
    description: '상큼한 레몬과 작은 꽃을 손그림으로 표현한 포인트 네일.',
    imageUrl: IMG.nail4,
    photos: [
      { id: 'design-4-photo-1', imageUrl: IMG.nail4, uploaderName: '모브 네일 성수', uploaderType: 'shop', uploaderAvatarUrl: IMG.shop1, uploadedAt: '2026.09.06', postId: 'post-3' },
      { id: 'design-4-photo-2', imageUrl: IMG.nail2, uploaderName: '라임', uploaderType: 'user', uploaderAvatarUrl: IMG.avatar1, uploadedAt: '2026.08.26', postId: 'post-2' },
    ],
    tags: ['드로잉', '과일', '키치', '옐로우'],
    estimatedPrice: '₩75,000 ~ ₩100,000',
    savedCount: 377,
    likeCount: 602,
    availableShopIds: ['shop-1'],
  },
];

export const publicPosts: CommunityPost[] = [
  {
    id: 'post-1',
    authorId: 'user-1',
    authorName: '핑크라떼',
    authorRole: 'general',
    category: '후기',
    title: '처음 받아본 복숭아 시럽 네일 후기',
    preview: '사진보다 실물이 훨씬 맑고 예뻐요. 손이 깨끗해 보이는 컬러를 찾는 분께 추천해요.',
    imageUrl: IMG.nail1,
    decoratedImage: DECORATED_PEACH_IMAGE,
    tags: ['시럽네일', '성수네일', '내돈내산'],
    createdAt: '2026.07.28',
    commentCount: 18,
    likeCount: 126,
    blocks: [
      { id: 'p1-b1', type: 'heading', content: '복숭아빛 한 방울 🍑', fontSize: 22, bold: true, align: 'left' },
      { id: 'p1-b2', type: 'text', content: '여름이라 맑고 투명한 컬러를 찾다가 모브 네일에서 시럽 프렌치를 받았어요. 피부 톤에 맞게 컬러를 두 가지 섞어주셔서 손이 정말 깨끗해 보여요.', fontSize: 16, align: 'left' },
      {
        id: 'p1-b3',
        type: 'image',
        imageUrl: IMG.nail1,
        decoratedImage: DECORATED_PEACH_IMAGE,
      },
      { id: 'p1-b4', type: 'divider' },
      { id: 'p1-b5', type: 'text', content: '유지력도 좋고 상담도 꼼꼼해서 다음 달 아트도 예약했답니다.', fontSize: 16, bold: true, align: 'center' },
    ],
  },
  {
    id: 'post-2',
    authorId: 'user-1',
    authorName: '핑크라떼',
    authorRole: 'general',
    category: '질문',
    title: '짧은 손톱에도 리본 파츠 괜찮을까요?',
    preview: '손톱이 짧고 작은 편인데 발레코어 디자인을 해보고 싶어요. 경험 있으신 분!',
    imageUrl: IMG.nail2,
    tags: ['짧은손톱', '리본네일'],
    createdAt: '2026.07.27',
    commentCount: 31,
    likeCount: 73,
    blocks: [
      { id: 'p2-b1', type: 'text', content: '손톱이 짧고 작은 편인데 발레코어 디자인을 해보고 싶어요. 작은 리본 파츠로도 충분히 예쁠까요?', fontSize: 16, align: 'left' },
      { id: 'p2-b2', type: 'image', imageUrl: IMG.nail2 },
    ],
  },
  {
    id: 'post-5',
    authorId: 'user-1',
    authorName: '핑크라떼',
    authorRole: 'general',
    category: '자유수다',
    title: '네일을 쉬는 동안 알게 된 작은 관리 습관',
    preview: '한 달 정도 컬러를 쉬면서 큐티클 오일을 꾸준히 발라봤어요. 사진은 없지만 손톱 끝이 덜 갈라지고 건조함도 확실히 줄어든 기록을 남겨봅니다.',
    tags: ['손톱관리', '네일휴식기', '큐티클오일'],
    createdAt: '2026.07.27',
    commentCount: 14,
    likeCount: 96,
    blocks: [
      { id: 'p5-b1', type: 'heading', content: '잠시 쉬어가는 것도 관리였어요', fontSize: 22, bold: true, align: 'left' },
      { id: 'p5-b2', type: 'text', content: '처음에는 컬러가 없는 손이 어색했지만, 아침과 자기 전에 오일을 바르는 습관을 들이니 손톱 끝이 눈에 띄게 덜 갈라졌어요.', fontSize: 16, align: 'left' },
      { id: 'p5-b3', type: 'divider' },
      { id: 'p5-b4', type: 'text', content: '다음 네일을 더 건강하게 즐기기 위한 짧은 휴식기라고 생각하니 마음도 편해졌답니다.', fontSize: 16, align: 'left' },
    ],
  },
  {
    id: 'post-4',
    authorId: 'owner-1',
    authorName: '모브 원장',
    authorRole: 'shop_owner',
    category: '추천',
    title: '손톤별로 골라본 가을 시럽 컬러 4가지',
    preview: '노란 기가 도는 손부터 붉은 기가 도는 손까지, 피부 톤에 자연스럽게 어울리는 시럽 컬러를 골라봤어요.',
    imageUrl: IMG.nail4,
    tags: ['시럽네일', '컬러추천', '가을네일'],
    createdAt: '2026.07.26',
    commentCount: 22,
    likeCount: 184,
    blocks: [
      { id: 'p4-b1', type: 'heading', content: '내 손에 잘 어울리는 시럽 컬러', fontSize: 22, bold: true, align: 'left' },
      { id: 'p4-b2', type: 'text', content: '웜톤에는 살구와 로지 베이지, 쿨톤에는 라일락과 말린 장미 컬러를 추천해요. 한 콧씩 얇게 올리면 피부 톤에 더 자연스럽게 스며듭니다.', fontSize: 16, align: 'left' },
      { id: 'p4-b3', type: 'image', imageUrl: IMG.nail4 },
    ],
  },
  {
    id: 'post-3',
    authorId: 'user-1',
    authorName: '젤리곰',
    authorRole: 'general',
    category: '추천',
    title: '여름 휴가 네일 컬러 조합 모음',
    preview: '코발트 블루부터 자몽 핑크까지, 휴양지에서 사진 잘 받는 조합을 모아봤어요.',
    imageUrl: IMG.nail3,
    tags: ['여름네일', '컬러추천'],
    createdAt: '2026.07.25',
    commentCount: 9,
    likeCount: 208,
    blocks: [
      { id: 'p3-b1', type: 'heading', content: '휴가 사진을 살리는 컬러', fontSize: 22, bold: true, align: 'center' },
      { id: 'p3-b2', type: 'image', imageUrl: IMG.nail3 },
      { id: 'p3-b3', type: 'text', content: '푸른 바다에서는 오렌지와 자몽 핑크가, 도심 여행에서는 실버 오로라가 특히 예뻤어요.', fontSize: 16, align: 'left' },
    ],
  },
];

export const shopPosts: CommunityPost[] = [
  {
    id: 'shop-post-1',
    authorId: 'owner-1',
    authorName: '모브 원장',
    authorRole: 'shop_owner',
    category: '운영팁',
    title: '노쇼를 줄인 예약 안내 메시지 문구',
    preview: '예약 하루 전 안내와 변경 마감 시간을 부드럽지만 명확하게 전달한 방법을 공유해요.',
    tags: ['노쇼', '예약관리', '운영팁'],
    createdAt: '2026.07.29',
    commentCount: 24,
    likeCount: 91,
    isShopOnly: true,
    blocks: [
      { id: 'sp1-b1', type: 'heading', content: '부드럽고 명확하게 안내하기', fontSize: 21, bold: true, align: 'left' },
      { id: 'sp1-b2', type: 'text', content: '예약 하루 전 오전에 위치, 주차, 변경 가능 시간을 한 번에 안내하고 있어요. 고객이 해야 할 행동을 짧게 적는 것이 핵심이었습니다.', fontSize: 16, align: 'left' },
      { id: 'sp1-b3', type: 'divider' },
      { id: 'sp1-b4', type: 'text', content: '“내일 만나요”처럼 환영하는 한 문장을 마지막에 넣으면 딱딱한 인상도 줄일 수 있어요.', fontSize: 16, bold: true, align: 'center' },
    ],
  },
  {
    id: 'shop-post-2',
    authorId: 'owner-2',
    authorName: '온유네일',
    authorRole: 'shop_owner',
    category: '재료추천',
    title: '요즘 손이 자주 가는 자석젤 3가지',
    preview: '입자가 곱고 발색이 맑은 제품 위주로 비교해봤어요. 자석 반응 속도도 함께 적었습니다.',
    imageUrl: IMG.nail3,
    tags: ['자석젤', '재료추천'],
    createdAt: '2026.07.26',
    commentCount: 16,
    likeCount: 75,
    isShopOnly: true,
    blocks: [
      { id: 'sp2-b1', type: 'text', content: '입자가 고운 실버, 샴페인 골드, 라벤더 계열을 비교해봤어요.', fontSize: 16, align: 'left' },
      { id: 'sp2-b2', type: 'image', imageUrl: IMG.nail3 },
    ],
  },
];

export const reviews: Review[] = [
  { id: 'review-1', shopId: 'shop-1', userId: 'user-1', userName: '핑크라떼', rating: 5, content: '컬러 상담이 정말 꼼꼼하고 큐티클 케어도 편안했어요.', createdAt: '2026.07.28' },
  { id: 'review-2', shopId: 'shop-1', userId: 'user-2', userName: '구름솜', rating: 5, content: '사진 그대로 구현해 주셨어요. 다음 달에도 방문할게요!', createdAt: '2026.07.20' },
  { id: 'review-4', shopId: 'shop-1', userId: 'user-4', userName: '윤슬', rating: 5, content: '손톱이 얇은 편인데 상태를 세심하게 봐주시고 유지력까지 챙겨주셨어요.', createdAt: '2026.07.12' },
  { id: 'review-5', shopId: 'shop-1', userId: 'user-5', userName: '라임', rating: 4, content: '공간이 조용하고 프라이빗해서 편안했어요. 드로잉도 섬세합니다.', createdAt: '2026.07.03' },
  { id: 'review-3', shopId: 'shop-2', userId: 'user-3', userName: '체리콕', rating: 4, content: '파츠 종류가 다양하고 공간이 예뻐요.', createdAt: '2026.07.18' },
];

export const reservations: Reservation[] = [
  { id: 'reservation-1', userId: 'user-1', shopId: 'shop-1', designId: 'design-1', date: '2026-08-03', time: '14:00', status: 'confirmed' },
  { id: 'reservation-2', userId: 'user-1', shopId: 'shop-2', designId: 'design-2', date: '2026-06-12', time: '11:30', status: 'completed' },
];

export const coupons: Coupon[] = [
  { id: 'coupon-1', title: 'Naily 첫 예약 웰컴 쿠폰', description: '첫 예약 고객이라면 어디서나 사용할 수 있어요.', discountText: '5,000원 OFF' },
  { id: 'coupon-2', title: '여름 페디 이벤트', description: '참여 숍의 이달의 페디 아트에 적용됩니다.', discountText: '10% OFF' },
];

export const comments: Comment[] = [
  { id: 'comment-1', postId: 'post-1', authorId: 'user-2', authorName: '구름솜', content: '컬러가 정말 맑아요! 저장해둘게요.', createdAt: '2026.07.29' },
  { id: 'comment-2', postId: 'post-1', authorId: 'owner-1', authorName: '모브 원장', content: '예쁜 후기 감사합니다 💗', createdAt: '2026.07.29' },
];

export const allPosts = [...publicPosts, ...shopPosts];


export const preferences = { followingIds: [] as string[], designIds: [] as string[], designLikes: [] as string[], shopIds: [] as string[], likedIds: [] as string[], savedIds: [] as string[], inquiries: [] as {id:string;shopId:string;text:string;answer?:string}[], drafts: {} as Record<string, any>, notifications: true };
const saved = readStore();
if (saved) {
  for (const [key, target] of Object.entries({ shops, designs, publicPosts, shopPosts, reservations, comments, reviews, magazineArticles })) {
    if (Array.isArray(saved[key])) target.splice(0, target.length, ...saved[key]);
  }
  allPosts.splice(0, allPosts.length, ...publicPosts, ...shopPosts);
  if (saved.currentUser && typeof saved.currentUser.nickname === 'string') Object.assign(currentUser, saved.currentUser);
  if (saved.preferences) {
    for (const key of ['followingIds','designIds','designLikes','shopIds','likedIds','savedIds','inquiries'] as const) {
      if (Array.isArray(saved.preferences[key])) (preferences[key] as any) = saved.preferences[key];
    }
    if (typeof saved.preferences.notifications === 'boolean') preferences.notifications = saved.preferences.notifications;
  }
}
export function commitData() {
  writeStore({ shops, designs, publicPosts, shopPosts, reservations, comments, reviews, magazineArticles, currentUser, preferences });
}
