import { magazineArticles } from '@/data/homeData';
import { allPosts, commitData, currentUser, publicPosts, shopPosts } from '@/data/mockData';
import { CommunityPost, PostBlock } from '@/types/models';
import { continuousBlocks } from '@/services/richWriting';

export type WritingMode = 'public' | 'shop' | 'magazine';
export const PUBLIC_CATEGORIES = ['질문', '후기', '추천', '자유수다', '샵후기'];
export const SHOP_CATEGORIES = ['운영팁', '재료추천', '고객응대', '가격고민', '노쇼', '마케팅', '시즌아트'];
export const MAGAZINE_CATEGORIES = ['TREND REPORT', 'COLOR GUIDE', 'NAIL CARE'];

// Keep the existing storage grammar: whitespace-separated tags, one leading # removed.
export const parsePostTags = (text: string) => text.split(/\s+/).map((tag) => tag.replace(/^#/, '')).filter(Boolean);
export function writingMode(requested: WritingMode, existing?: CommunityPost): WritingMode {
  if (!existing) return requested;
  if (existing.isShopOnly) return 'shop';
  // Home magazine cards can link to ordinary public posts; that is not a type flag.
  return requested === 'magazine' ? 'magazine' : 'public';
}
export function initialPostBlocks(existing?: CommunityPost): PostBlock[] {
  const blocks: PostBlock[] = existing ? continuousBlocks(existing.blocks).map((block) => ({
    ...block,
    video: block.video ? { ...block.video } : undefined,
    place: block.place ? { ...block.place } : undefined,
    poll: block.poll ? { ...block.poll, options: block.poll.options.map(option => ({ ...option })) } : undefined,
    runs: block.runs?.map(run => ({ ...run })),
    decoratedImage: block.decoratedImage ? { ...block.decoratedImage, ...(block.decoratedImage.photoTransform ? { photoTransform: { ...block.decoratedImage.photoTransform } } : {}), decorations: block.decoratedImage.decorations.map((item) => ({ ...item, ...(item.points ? { points: item.points.map(point => ({ ...point })) } : {}) })) } : undefined,
  })) : [{ id: 'draft-text', type: 'text', content: '' }];
  if (!blocks.length || !['text', 'heading'].includes(blocks[blocks.length - 1].type)) blocks.push({ id: 'draft-tail-text', type: 'text', content: '' });
  return blocks;
}

/** Device-local save shared by detail and editor. */
export function savePostDraft({ title, category, tagText, blocks, mode, existing }: {
  title: string; category: string; tagText: string; blocks: PostBlock[]; mode: WritingMode; existing?: CommunityPost;
}): CommunityPost {
  if (!title.trim()) throw new Error('제목을 입력해주세요.');
  const now = Date.now();
  const firstImage = blocks.find((block) => block.type === 'image' && block.imageUrl);
  const textPreview = blocks.find((block) => block.type === 'text' && block.content?.trim())?.content?.trim() ?? '새로 등록된 네일 이야기입니다.';
  const effectiveMode = writingMode(mode, existing);
  const post: CommunityPost = {
    ...existing,
    id: existing?.id ?? `post-${now}`,
    authorId: existing?.authorId ?? currentUser.id,
    authorName: existing?.authorName ?? currentUser.nickname,
    authorRole: existing?.authorRole ?? currentUser.role,
    category, title: title.trim(), preview: textPreview, blocks,
    tags: parsePostTags(tagText), imageUrl: firstImage?.imageUrl, decoratedImage: firstImage?.decoratedImage,
    createdAt: existing?.createdAt ?? new Date().toLocaleDateString('ko-KR').replace(/\s/g, ''),
    commentCount: existing?.commentCount ?? 0, likeCount: existing?.likeCount ?? 0,
    isShopOnly: effectiveMode === 'shop' || undefined,
  };
  const target = effectiveMode === 'shop' ? shopPosts : publicPosts;
  if (existing) {
    for (const posts of [allPosts, target]) {
      const index = posts.findIndex((item) => item.id === existing.id);
      if (index >= 0) posts.splice(index, 1, post);
    }
  } else {
    allPosts.unshift(post);
    target.unshift(post);
  }
  if (effectiveMode === 'magazine' && firstImage?.imageUrl) {
    const index = magazineArticles.findIndex((article) => article.postId === post.id);
    const article = { id: index >= 0 ? magazineArticles[index].id : `magazine-${now}`, postId: post.id, category, title: post.title, description: textPreview, authorName: post.authorName, readingTime: '3분', imageUrl: firstImage.imageUrl, decoratedImage: firstImage.decoratedImage };
    if (index >= 0) magazineArticles.splice(index, 1, article); else magazineArticles.unshift(article);
  }
  commitData?.();
  return post;
}
