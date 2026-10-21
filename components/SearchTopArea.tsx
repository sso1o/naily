import { TYPOGRAPHY } from '@/constants/typography';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/colors';

type Props = {
  value?: string;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  onSubmit?: () => void;
  showTitle?: boolean;
  placeholder?: string;
};

export default function SearchTopArea({
  value,
  onChangeText,
  onPress,
  onSubmit,
  showTitle = true,
  placeholder = '어떤 네일을 찾고 있나요?',
}: Props) {
  const search = (
    <View style={styles.search}>
      <Text style={styles.icon}>⌕</Text>
      {onPress ? (
        <Text style={styles.placeholder}>{placeholder}</Text>
      ) : (
        <TextInput
          autoCapitalize="none"
          returnKeyType="search"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={COLORS.subText}
          style={styles.input}
        />
      )}
    </View>
  );

  return (
    <View style={styles.area}>
      {showTitle && (
        <View style={styles.heading}>
          <View>
            <Text style={styles.brand}>Naily</Text>
            <Text style={styles.subtitle}>오늘도 손끝에 설렘을</Text>
          </View>
          <View style={styles.bell}><Text style={styles.bellText}>♡</Text></View>
        </View>
      )}
      {onPress ? <Pressable onPress={onPress}>{search}</Pressable> : search}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { backgroundColor: COLORS.lightPink, paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: 20 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brand: { color: COLORS.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { ...TYPOGRAPHY.bodySmall, color: '#9A6474', marginTop: 2 },
  bell: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  bellText: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  search: { height: 50, borderRadius: RADIUS.pill, backgroundColor: COLORS.card, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center' },
  icon: { color: COLORS.text, fontSize: 24, marginRight: 9, transform: [{ rotate: '-20deg' }] },
  placeholder: { ...TYPOGRAPHY.bodyMedium, color: COLORS.subText },
  input: { ...TYPOGRAPHY.bodyMedium, flex: 1, color: COLORS.text, paddingVertical: 0 },
});
