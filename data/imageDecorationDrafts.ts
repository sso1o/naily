import { DecoratedPostImage } from '@/types/models';

const drafts = new Map<string, DecoratedPostImage>();

export function setImageDecorationDraft(key: string, image: DecoratedPostImage) {
  drafts.set(key, image);
}

export function getImageDecorationDraft(key: string) {
  return drafts.get(key);
}

export function takeImageDecorationDraft(key: string) {
  const image = drafts.get(key);
  drafts.delete(key);
  return image;
}
