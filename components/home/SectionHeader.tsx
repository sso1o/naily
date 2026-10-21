import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { CONTENT_HORIZONTAL_PADDING } from '@/constants/layout';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export default function SectionHeader({
  title,
  subtitle,
  actionLabel = '전체보기',
  onPressAction,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onPressAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onPressAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: CONTENT_HORIZONTAL_PADDING, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 },
  copy: { flex: 1, paddingRight: 16, minWidth: 160 },
  title: { ...TYPOGRAPHY.titleMedium, color: COLORS.text, letterSpacing: -0.6 },
  subtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, marginTop: 3 },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, minHeight: 40 },
  pressed: {
    opacity: 0.55,
  },
  actionText: { ...TYPOGRAPHY.labelLarge, color: '#8A737A' },
  chevron: {
    color: '#8A737A',
    fontSize: 18,
    marginLeft: 4,
    marginTop: -1,
  },
});
