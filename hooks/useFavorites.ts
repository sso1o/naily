import { useSyncExternalStore } from "react";
import { preferences, commitData } from "@/data/mockData";
const listeners = new Set<() => void>();
let version = 0;
export function useFavorites(
  key: "designIds" | "designLikes" | "shopIds",
  id: string,
) {
  useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => version,
    () => version,
  );
  return [
    preferences[key].includes(id),
    () => {
      preferences[key] = preferences[key].includes(id)
        ? preferences[key].filter((value) => value !== id)
        : [...preferences[key], id];
      commitData();
      version++;
      listeners.forEach((callback) => callback());
    },
  ] as const;
}
