import { useSyncExternalStore } from 'react';
import { getPostInteractions, subscribePostInteractions, togglePostLike, togglePostSave } from '@/services/postInteractions';

export function usePostInteractions() {
  const state = useSyncExternalStore(subscribePostInteractions, getPostInteractions, getPostInteractions);
  return { ...state, toggleLike: togglePostLike, toggleSave: togglePostSave };
}
