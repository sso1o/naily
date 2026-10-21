import { publicPosts } from '@/data/mockData';
import type { CommunityPost } from '@/types/models';

export function snapshotPosts(items: CommunityPost[]): CommunityPost[] {
  // Keep source order and first occurrence. Post blocks are mutable demo data.
  const seen = new Set<string>();
  return JSON.parse(JSON.stringify(items.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  }))) as CommunityPost[];
}

export const readLocalCommunityPosts = () => snapshotPosts(publicPosts);

// No database exists yet. Read the live local collection on every call; this is
// deliberately not a fabricated HTTP request or a simulated pagination API.
export async function loadCommunityPosts(): Promise<CommunityPost[]> {
  return readLocalCommunityPosts();
}
