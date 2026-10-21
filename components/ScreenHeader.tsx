import { TYPOGRAPHY } from '@/constants/typography';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';

export default function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="뒤로 가기" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { color: COLORS.text, fontSize: 34, lineHeight: 37, fontWeight: '300' },
  title: { ...TYPOGRAPHY.titleSmall, flex: 1, minWidth: 0, paddingHorizontal: 8, textAlign: 'center', color: COLORS.text },
  right: { minWidth: 40, maxWidth: '35%', alignItems: 'flex-end', paddingVertical: 8 },
});
