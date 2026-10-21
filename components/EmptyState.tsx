import { TYPOGRAPHY } from '@/constants/typography';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';

export default function EmptyState({ title = '아직 내용이 없어요', message = '조금만 기다리면 예쁜 소식이 찾아올 거예요.' }: { title?: string; message?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>♡</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 28 },
  icon: { color: COLORS.primary, fontSize: 42 },
  title: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, marginTop: 10 },
  message: { ...TYPOGRAPHY.bodySmall, color: COLORS.subText, textAlign: 'center', marginTop: 7 },
});
