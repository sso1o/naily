import { TYPOGRAPHY, FONT_WEIGHT } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS } from '@/constants/colors';

type Option<T extends string> = readonly [T, string];

export default function SearchSortSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  title: string;
  options: ReadonlyArray<Option<T>>;
  value: T;
  onClose: () => void;
  onChange: (value: T) => void;
}) {
  const translateY = useRef(new Animated.Value(420)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    closingRef.current = false;
    translateY.setValue(420);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [translateY, visible]);

  const closeSheet = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: 420,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={closeSheet}>
      <Pressable accessibilityLabel="정렬 닫기" onPress={closeSheet} style={styles.backdrop} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {options.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => { onChange(key); closeSheet(); }}
            style={styles.option}
          >
            <Text style={[styles.optionText, value === key && styles.selectedText]}>{label}</Text>
            {value === key ? <Ionicons name="checkmark" size={20} color={COLORS.primary} /> : null}
          </Pressable>
        ))}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(25,18,20,0.28)' },
  sheet: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', backgroundColor: '#D8D0D3' },
  title: { ...TYPOGRAPHY.titleSmall, color: COLORS.text, marginTop: 18, marginBottom: 8 },
  option: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text },
  selectedText: { fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
});
