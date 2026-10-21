import { allPosts, publicPosts, shopPosts, comments, commitData, preferences } from '@/data/mockData';
import type { Comment } from '@/types/models';

// Shared device-local interactions. Counts in mockData remain base counts
// for likes; the selected user's like is added once by the card/detail renderer.
let state = { likedIds: new Set<string>(preferences?.likedIds ?? []), savedIds: new Set<string>(preferences?.savedIds ?? []) };
const listeners = new Set<() => void>();
export const getPostInteractions = () => state;
export function subscribePostInteractions(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function toggle(key: 'likedIds' | 'savedIds', id: string) {
  const next = new Set(state[key]);
  if (next.has(id)) next.delete(id); else next.add(id);
  state = { ...state, [key]: next };
  if (preferences) { preferences.likedIds = [...state.likedIds]; preferences.savedIds = [...state.savedIds]; commitData?.(); }
  listeners.forEach((listener) => listener());
}
export const togglePostLike = (id: string) => toggle('likedIds', id);
export const togglePostSave = (id: string) => toggle('savedIds', id);

export function addLocalComment(comment: Comment) {
  if (comments.some((item) => item.id === comment.id)) return;
  comments.push(comment);
  // Collections can share object references. Increment each object only once.
  new Set([...allPosts, ...publicPosts, ...shopPosts]).forEach((post) => {
    if (post.id === comment.postId) post.commentCount++;
  });
  commitData?.();
}
