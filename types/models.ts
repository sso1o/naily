export type UserRole = 'general' | 'shop_owner' | 'admin';

export type PostBlockType = 'text' | 'heading' | 'image' | 'divider' | 'video' | 'place' | 'poll';

export type TextAlign = 'left' | 'center' | 'right';

export type PostTextRun = { text: string; fontSize?: number; bold?: boolean; italic?: boolean; underline?: boolean; fontFamily?: 'system' | 'serif' | 'monospace'; color?: string; backgroundColor?: string; align?: TextAlign };

export type ImageDecoration = {
  id: string;
  type: 'text' | 'gradient' | 'shape' | 'drawing';
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  role?: 'title' | 'label' | 'body';
  x: number;
  y: number;
  /** Optional for legacy records: degrees, multiplier, and stable paint order. */
  rotation?: number;
  scale?: number;
  layer?: number;
  /** New overlays scale all metrics against a 390dp reference image. */
  coordinateVersion?: 2;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderRadius?: number;
  maxLines?: number;
  opacity?: number;
  gradientColors?: readonly [string, string, ...string[]];
};

export type DecoratedPostImage = {
  uri: string;
  aspectRatio?: number;
  decorations: ImageDecoration[];
  photoTransform?: { x: number; y: number; scale: number; rotation: number };
};

export type User = {
  id: string;
  role: UserRole;
  nickname: string;
  avatarUrl?: string;
  isShopVerified?: boolean;
};

export type Shop = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  distance?: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  priceRange: string;
  imageUrl?: string;
  photos?: string[];
  tags: string[];
  phone?: string;
  nearestStation?: string;
  businessHours?: string;
  breakTime?: string;
  closedDays?: string;
  notice?: string;
  amenities?: string[];
  benefit?: { title: string; description: string };
  menus?: Array<{ name: string; detail: string; price: string }>;
  monthlyArtAlbums?: Array<{
    id: string;
    month: string;
    media: Array<{
      id: string;
      type: 'image' | 'video';
      uri: string;
      thumbnailUrl?: string;
      aspectRatio: 1;
      price: string;
    }>;
  }>;
};

export type Design = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  photos?: Array<{
    id: string;
    imageUrl: string;
    uploaderName: string;
    uploaderType: 'user' | 'shop';
    uploaderAvatarUrl?: string;
    likeCount?: number;
    uploadedAt?: string;
    postId?: string;
  }>;
  tags: string[];
  estimatedPrice: string;
  savedCount: number;
  likeCount: number;
  availableShopIds: string[];
};

export type PostBlock = {
  id: string;
  type: PostBlockType;
  content?: string;
  runs?: PostTextRun[];
  imageUrl?: string;
  /** Display width in the document, independent of the photo crop. */
  widthRatio?: number;
  decoratedImage?: DecoratedPostImage;
  video?: { uri: string; aspectRatio?: number };
  place?: { name: string; address: string };
  poll?: { question: string; options: { id: string; text: string; votes?: number }[]; votedOptionId?: string };
  fontSize?: number;
  bold?: boolean;
  align?: TextAlign;
};

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  category: string;
  title: string;
  preview: string;
  blocks: PostBlock[];
  tags: string[];
  imageUrl?: string;
  decoratedImage?: DecoratedPostImage;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  isShopOnly?: boolean;
};

export type Review = {
  ownerReply?: string;
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
};

export type Reservation = {
  id: string;
  userId: string;
  shopId: string;
  designId?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

export type Comment = {
  parentId?: string;
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  title: string;
  description: string;
  discountText: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
};

export type MagazineArticle = {
  id: string;
  postId: string;
  category: string;
  title: string;
  description: string;
  authorName: string;
  readingTime: string;
  imageUrl?: string;
  decoratedImage?: DecoratedPostImage;
};

export type NearbyShop = {
  id: string;
  shopId: string;
  name: string;
  imageUrl?: string;
  distance: string;
  rating: number;
  reviewCount: number;
  area: string;
  tags: string[];
  isReservable: boolean;
};

export type MonthlyArt = {
  id: string;
  designId: string;
  shopId: string;
  title: string;
  shopName: string;
  imageUrl?: string;
  price: number;
  discountedPrice?: number;
  distance: string;
  badge: string;
  likeCount: number;
};

export type PopularCommunityPost = {
  id: string;
  postId: string;
  authorName: string;
  authorAvatarUrl?: string;
  isShopVerified: boolean;
  title: string;
  preview: string;
  imageUrl?: string;
  decoratedImage?: DecoratedPostImage;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  relativeTime: string;
};

export type AdBannerData = {
  id: string;
  adUnitId?: string;
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  imageUrl?: string;
  link?: string;
};
