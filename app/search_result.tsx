import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacySearchResultScreen() {
  const params = useLocalSearchParams<{ query?: string; category?: string }>();
  return <Redirect href={{ pathname: '/search', params: { query: params.query ?? '', category: params.category ?? 'all' } }} />;
}
