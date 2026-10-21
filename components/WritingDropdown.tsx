import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export type MenuAnchor = { x: number; y: number; width: number; height: number };
type Props = { visible: boolean; anchor: MenuAnchor | null; width: number; title: string; options: { value: string | number; label: string }[]; selected?: string | number; onSelect: (value: string | number) => void; onClose: () => void; onDismiss: () => void };

/** Measure both surfaces in window coordinates so safe areas and modal origins agree. */
export default function WritingDropdown(props: Props) {
  const window = useWindowDimensions();
  const root = useRef<View>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const width = Math.min(props.width, window.width - 16);
  const available = Math.max(80, window.height - (props.anchor?.y ?? 0) - (props.anchor?.height ?? 0) - 16);
  const height = Math.max(40, Math.min(props.options.length * 40 + 8, available, 300, window.height - 16));
  const left = Math.max(8, Math.min((props.anchor?.x ?? 8) - origin.x, window.width - width - 8));
  const top = Math.max(8, Math.min((props.anchor?.y ?? 0) + (props.anchor?.height ?? 0) - origin.y + 4, window.height - height - 8));
  return <Modal visible={props.visible} transparent animationType="none" statusBarTranslucent onRequestClose={props.onClose} onDismiss={props.onDismiss}>
    <View ref={root} style={styles.overlay} onLayout={() => root.current?.measureInWindow((x, y) => setOrigin({ x, y }))}>
      <Pressable accessibilityLabel="서식 메뉴 닫기" onPress={props.onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityLabel={props.title} style={[styles.menu, { left, top, width, maxHeight: height }]}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {props.options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: props.selected === option.value }} onPress={() => props.onSelect(option.value)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <Text style={[styles.label, props.selected === option.value && styles.selected]}>{option.label}</Text>
            {props.selected === option.value && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
          </Pressable>)}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1 },
  menu: { position: 'absolute', backgroundColor: COLORS.card, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border, boxShadow: '0px 4px 16px rgba(17,17,17,0.10)', overflow: 'hidden' },
  list: { paddingVertical: 4 }, item: { minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { ...TYPOGRAPHY.labelMedium, color: COLORS.text }, selected: { color: COLORS.primary }, pressed: { backgroundColor: `${COLORS.primary}14` },
});
