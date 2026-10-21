import { TYPOGRAPHY } from '@/constants/typography';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'default' | 'small';
  accessibilityLabel?: string;
  busy?: boolean;
  style?: ViewStyle;
};

export default function PrimaryButton({ label, onPress, disabled, variant = 'primary', size = 'default', accessibilityLabel = label, busy, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        size === 'small' ? styles.touch : styles.base,
        size !== 'small' && (variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.outline),
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.content, size === 'small' && styles.compact, size === 'small' && (variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.outline)]}>
        {busy ? <ActivityIndicator size="small" color={variant === 'primary' ? '#FFFFFF' : COLORS.primary} /> : <Text numberOfLines={1} style={[styles.label, size === 'small' && styles.smallLabel, variant !== 'primary' && styles.outlineLabel]}>{label}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 50, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.sm * 2, paddingVertical: SPACING.xs * 2 },
  touch: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 32, minWidth: 44, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  smallLabel: { ...TYPOGRAPHY.labelMedium },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  primary: { backgroundColor: COLORS.primary },
  outline: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary },
  label: { ...TYPOGRAPHY.labelLarge, color: '#FFFFFF', textAlign: 'center' },
  outlineLabel: { color: COLORS.primary },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
