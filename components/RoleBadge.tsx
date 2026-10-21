import { TYPOGRAPHY } from '@/constants/typography';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { UserRole } from '@/types/models';

const LABELS: Record<UserRole, string> = {
  general: '일반 사용자',
  shop_owner: '샵 사용자',
  admin: '관리자',
};

export default function RoleBadge({ role, verified }: { role: UserRole; verified?: boolean }) {
  return (
    <View style={[styles.badge, role === 'shop_owner' && styles.shop, role === 'admin' && styles.admin]}>
      <Text style={[styles.label, role !== 'general' && styles.lightLabel]}>
        {verified ? '✓ ' : ''}{LABELS[role]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.pill, backgroundColor: COLORS.lightPink },
  shop: { backgroundColor: COLORS.primary },
  admin: { backgroundColor: COLORS.text },
  label: { ...TYPOGRAPHY.labelMedium, color: '#9A6474' },
  lightLabel: { color: '#FFFFFF' },
});
