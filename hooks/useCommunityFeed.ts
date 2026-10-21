import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadCommunityPosts, readLocalCommunityPosts, snapshotPosts } from '@/services/communityFeed';
import { CommunityPost } from '@/types/models';
import { refreshHaptic } from '@/services/refreshHaptic';

type ReadPosts = () => CommunityPost[] | Promise<CommunityPost[]>;

export function useCommunityFeed(read: ReadPosts = loadCommunityPosts) {
  // Local data is available synchronously; there is no initial network loading phase.
  const [posts, setPosts] = useState(readLocalCommunityPosts);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCompletion, setRefreshCompletion] = useState(0);
  const refreshingRef = useRef(false);

  const replacePosts = useCallback((next: CommunityPost[]) => {
    setPosts((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
  }, []);

  // Returning from the editor picks up local writes, but tab focus never fetches.
  useFocusEffect(useCallback(() => {
    if (!refreshingRef.current) replacePosts(readLocalCommunityPosts());
  }, [replacePosts]));

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    setError(null);
    // Fire once after acquiring the request lock; never wait for device feedback.
    void refreshHaptic();
    try {
      const next = await read();
      // The current source is mutable local data, not a server/cache. Detach the
      // snapshot so in-place edits (including nested blocks) reach memoized rows.
      // Replace the entire feed; there is no pagination in the current app.
      setPosts(snapshotPosts(next));
      // A successful read is observable even when the source has not changed.
      setRefreshCompletion((count) => count + 1);
    } catch {
      setError('새로고침하지 못했어요. 다시 시도해 주세요.');
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [read]);

  return { posts, refreshing, error, refresh, refreshCompletion };
}
