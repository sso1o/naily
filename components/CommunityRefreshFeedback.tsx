import { TYPOGRAPHY } from '@/constants/typography';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';

export default function CommunityRefreshFeedback({ completion, refreshing }: { completion: number; refreshing: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!completion) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [completion]);
  useEffect(() => {
    if (refreshing) setVisible(false);
  }, [refreshing]);

  if (!visible || refreshing) return null;
  return <View pointerEvents="none" style={styles.notice}>
    <Text accessibilityLiveRegion="polite" role="status" style={styles.text}>새로고침 완료</Text>
  </View>;
}

const styles = StyleSheet.create({
  notice: { position: 'absolute', top: 64, alignSelf: 'center', maxWidth: '90%', paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.pill, backgroundColor: COLORS.lightPink },
  text: { ...TYPOGRAPHY.labelMedium, color: '#724555' },
});
