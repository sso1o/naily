import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import ColorPicker from './ColorPicker';
import { normalizeColor } from '@/services/colorPicking';
import { isLoaded } from 'expo-font';
import WritingSheet from './WritingSheet';
import WritingDropdown, { MenuAnchor } from './WritingDropdown';
import type { RichCommand, RichInputState } from './RichWritingInput';
type Picker = 'fontFamily' | 'size' | 'color' | 'backgroundColor';
type Props = { images?: string[]; onPhoto: () => void; onVideo: () => void; onDivider: () => void; onPlace: () => void; onPoll: () => void; hasSelection: boolean; disabled?: boolean; format: Partial<RichInputState>; onFormat: (kind: RichCommand, value?: string | number) => void };
function Tool({ label, display, onPress, disabled, selected, color, icon, anchorRef, selector }: { label: string; display?: string; onPress: () => void; disabled?: boolean; selected?: boolean; color?: string; icon?: React.ComponentProps<typeof Ionicons>['name']; anchorRef?: React.Ref<View>; selector?: boolean }) {
  const highlight = selected && ['B', 'I', 'U'].includes(display ?? '');
  return <Pressable ref={anchorRef} collapsable={false} accessibilityRole="button" accessibilityLabel={label} accessibilityValue={color ? { text: color === 'transparent' ? '색상 없음' : color } : undefined} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tool, disabled && styles.disabled, pressed && styles.pressed]}>
    <View style={[styles.visual, (icon || selector) && styles.mediaVisual, highlight && styles.active]}>
      {icon && <Ionicons name={icon} size={18} color={selected ? COLORS.primary : COLORS.text} />}
      <Text style={[icon ? styles.caption : styles.text, selected && styles.selectedText, display === 'I' && { fontStyle: 'italic' }, display === 'U' && { textDecorationLine: 'underline' }]}>{display ?? label}</Text>
      {selector && <Ionicons name="chevron-down" size={10} color={COLORS.subText} />}
      {color && <View style={[styles.indicator, { backgroundColor: color }, color === 'transparent' && { borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border }]} />}
    </View>
  </Pressable>;
}
export default function EditorToolbar(props: Props) {
  const [picker, setPicker] = useState<Picker | null>(null);
  const pending = useRef<{ kind: Picker; value: string | number } | null>(null);
  const fontTrigger = useRef<View>(null);
  const sizeTrigger = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const { disabled, hasSelection, format, onFormat } = props;
  const unavailable = disabled || !hasSelection;
  const select = (value: number | string) => { if (picker) { if (Platform.OS === 'ios') pending.current = { kind: picker, value }; else onFormat(picker, value); } setPicker(null); };
  const titles = { fontFamily: '폰트', size: '글자 크기', color: '글자 색상', backgroundColor: '글자 배경색' };
  const openDropdown = (kind: 'fontFamily' | 'size') => {
    (kind === 'fontFamily' ? fontTrigger : sizeTrigger).current?.measureInWindow((x, y, width, height) => { setAnchor({ x, y, width, height }); setPicker(kind); });
  };
  const close = () => { pending.current = null; setPicker(null); };
  const dismissed = () => { const command = pending.current; pending.current = null; if (command) onFormat(command.kind, command.value); };
  return <View style={styles.bar}>
    <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} style={styles.toolbarRow} contentContainerStyle={styles.row}>
      <Tool label="사진" icon="image-outline" onPress={props.onPhoto} disabled={disabled} /><Tool label="동영상" icon="videocam-outline" onPress={props.onVideo} disabled={disabled} /><Tool label="구분선" icon="remove-outline" onPress={props.onDivider} disabled={disabled} /><Tool label="장소" icon="location-outline" onPress={props.onPlace} disabled={disabled} /><Tool label="투표" icon="bar-chart-outline" onPress={props.onPoll} disabled={disabled} />
    </ScrollView>
    <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} style={[styles.toolbarRow, styles.formatRow]} contentContainerStyle={styles.row}>
      <Tool label="폰트" display={format.fontFamily === 'serif' ? '명조' : format.fontFamily === 'monospace' ? '고정폭' : '기본서체'} selector anchorRef={fontTrigger} onPress={() => openDropdown('fontFamily')} disabled={unavailable} />
      <Tool label="크기" display={`${Math.round(format.size ?? 15)}`} selector anchorRef={sizeTrigger} onPress={() => openDropdown('size')} disabled={unavailable} />
      <Tool label="글자 굵게" display="B" selected={format.bold} onPress={() => onFormat('bold')} disabled={unavailable} /><Tool label="글자 기울임" display="I" selected={format.italic} onPress={() => onFormat('italic')} disabled={unavailable} /><Tool label="글자 밑줄" display="U" selected={format.underline} onPress={() => onFormat('underline')} disabled={unavailable} />
      <Tool label="글자 색상" display="A" color={normalizeColor(format.color ?? '#383438')} onPress={() => setPicker('color')} disabled={unavailable} /><Tool label="글자 배경색" display="▰" color={normalizeColor(format.backgroundColor ?? 'transparent')} onPress={() => setPicker('backgroundColor')} disabled={unavailable} />
    </ScrollView>
    <WritingDropdown visible={picker === 'fontFamily' || picker === 'size'} anchor={anchor} width={picker === 'fontFamily' ? 156 : 96} title={picker === 'fontFamily' ? '폰트 선택' : '글자 크기 선택'} options={picker === 'fontFamily' ? [{ value: 'system', label: '기본서체' }, ...(isLoaded('NailySerifRegular') && format.fontsReady !== false ? [{ value: 'serif', label: '나눔명조' }] : [])] : [12, 14, 15, 16, 18, 20, 24].map(value => ({ value, label: String(value) }))} selected={picker === 'fontFamily' ? format.fontFamily ?? 'system' : format.size ?? 15} onSelect={select} onClose={close} onDismiss={dismissed} />
    <WritingSheet visible={picker === 'color' || picker === 'backgroundColor'} title={picker ? titles[picker] : ''} onClose={close} onDismiss={dismissed}>
      {(picker === 'color' || picker === 'backgroundColor') && <ColorPicker value={picker === 'color' ? format.color ?? '#383438' : format.backgroundColor ?? 'transparent'} allowTransparent={picker === 'backgroundColor'} images={props.images} onChange={select} />}
    </WritingSheet>
  </View>;
}
const styles = StyleSheet.create({
  bar: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  toolbarRow: { height: 40, flexGrow: 0 },
  formatRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  row: { flexGrow: 1, alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 8 },
  tool: { minWidth: 40, minHeight: 40, paddingHorizontal: 6, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  visual: { minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  mediaVisual: { flexDirection: 'row', gap: 4 },
  text: { ...TYPOGRAPHY.labelMedium, color: COLORS.text },
  caption: { ...TYPOGRAPHY.caption, color: COLORS.text },
  selectedText: { color: COLORS.primary },
  active: { backgroundColor: `${COLORS.primary}14`, borderRadius: 6 },
  indicator: { position: 'absolute', bottom: 0, height: 2, width: 12, borderRadius: 1 },
  pressed: { opacity: 0.55 },
  disabled: { opacity: 0.35 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { minWidth: 44, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
});
