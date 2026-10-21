import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function TagChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>#{label.replace(/^#/, '')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: COLORS.lightPink },
  selected: { backgroundColor: COLORS.primary },
  label: { ...TYPOGRAPHY.labelMedium, color: '#9A6474' },
  selectedLabel: { color: '#FFFFFF' },
});
