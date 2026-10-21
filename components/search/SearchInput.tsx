import { TYPOGRAPHY } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';
import { SEARCH_FIELD_HEIGHT } from '@/constants/layout';

type Props = Pick<TextInputProps, 'onFocus' | 'onBlur'> & {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

const SearchInput = forwardRef<TextInput, Props>(function SearchInput(
  { value, onChangeText, onSubmit, onClear, onFocus, onBlur },
  ref,
) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={COLORS.subText} />
      <TextInput
        ref={ref}
        accessibilityLabel="통합 검색"
        autoCapitalize="none"
        autoCorrect={false}
        enterKeyHint="search"
        maxLength={60}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onSubmitEditing={onSubmit}
        placeholder="네일 디자인, 커뮤니티, 네일샵 검색"
        placeholderTextColor="#999094"
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="검색어 지우기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClear}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={17} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
});

export default SearchInput;

const styles = StyleSheet.create({
  container: {
    minHeight: SEARCH_FIELD_HEIGHT,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1F2',
  },
  input: { ...TYPOGRAPHY.bodyMedium, flex: 1, minWidth: 0, minHeight: SEARCH_FIELD_HEIGHT, paddingHorizontal: 10, paddingVertical: 8, color: COLORS.text, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8ADB1',
  },
  pressed: { opacity: 0.65 },
});
