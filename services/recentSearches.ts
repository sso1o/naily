const STORAGE_KEY = 'naily.recent-searches.v1';
const SAVING_ENABLED_KEY = 'naily.recent-searches-saving.v1';
let memoryRecentSearches = ['성수 네일', '자석 네일', '여름 네일', '웨딩 네일'];
let memorySavingEnabled = true;

const canUseLocalStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export function loadRecentSearches() {
  if (!canUseLocalStorage()) return memoryRecentSearches;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : memoryRecentSearches;
  } catch {
    return memoryRecentSearches;
  }
}

export function saveRecentSearches(items: string[]) {
  memoryRecentSearches = items.slice(0, 10);
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryRecentSearches));
  } catch {
    // Search remains fully usable if browser storage is unavailable.
  }
}

export function loadRecentSearchSaving() {
  if (!canUseLocalStorage()) return memorySavingEnabled;
  try {
    const stored = window.localStorage.getItem(SAVING_ENABLED_KEY);
    return stored === null ? memorySavingEnabled : stored === 'true';
  } catch {
    return memorySavingEnabled;
  }
}

export function saveRecentSearchSaving(enabled: boolean) {
  memorySavingEnabled = enabled;
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(SAVING_ENABLED_KEY, String(enabled));
  } catch {
    // Search remains fully usable if browser storage is unavailable.
  }
}
