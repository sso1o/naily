import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View, type GestureResponderEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';
import PrimaryButton from './PrimaryButton';
import { hsvColor, normalizeColor, pixelColor } from '@/services/colorPicking';
import { imagePixels } from '@/services/imagePixels';

const common = ['#383438', '#FFFFFF', '#777777', '#DFA6B6', '#DC4869', '#E59B52', '#FFDF80', '#258252', '#2467B5', '#A03CA6'];
type Props = { value?: string; onChange: (color: string) => void; images?: string[]; allowTransparent?: boolean };
export default function ColorPicker({ value, onChange, images = [], allowTransparent }: Props) {
  const [color, setColor] = useState(normalizeColor(value));
  const [hex, setHex] = useState(color === 'transparent' ? '#383438' : color);
  const [hue, setHue] = useState(0);
  const currentHue = useRef(hue); currentHue.current = hue;
  const [sampling, setSampling] = useState(false);
  const [pixels, setPixels] = useState<Awaited<ReturnType<typeof imagePixels>> | null>(null);
  const [status, setStatus] = useState('');
  const spectrumView = useRef<View>(null);
  const hueView = useRef<View>(null);
  const photoView = useRef<View>(null);
  const mounted = useRef(true);
  const request = useRef(0);
  const picking = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current++; }; }, []);
  const choose = (next: string) => { if (next !== 'transparent' && !/^#[0-9a-f]{6}$/i.test(next)) return; setColor(next); if (next !== 'transparent') setHex(next); };
  const point = (event: GestureResponderEvent, view: React.RefObject<View | null>, apply: (x: number, y: number) => void) => {
    const native = event.nativeEvent as typeof event.nativeEvent & { clientX?: number; clientY?: number };
    const x = native.clientX ?? native.pageX, y = native.clientY ?? native.pageY;
    view.current?.measureInWindow((left, top, width, height) => { if (width > 0 && height > 0 && Number.isFinite(x) && Number.isFinite(y)) apply(Math.max(0, Math.min(1, (x - left) / width)), Math.max(0, Math.min(1, (y - top) / height))); });
  };
  const spectrumGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => point(event, spectrumView, (x, y) => choose(hsvColor(currentHue.current, x, 1 - y))),
    onPanResponderMove: event => point(event, spectrumView, (x, y) => choose(hsvColor(currentHue.current, x, 1 - y))),
  }), []);
  const hueGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => point(event, hueView, x => { const next = Math.min(359, x * 360); setHue(next); choose(hsvColor(next, 1, 1)); }),
    onPanResponderMove: event => point(event, hueView, x => { const next = Math.min(359, x * 360); setHue(next); choose(hsvColor(next, 1, 1)); }),
  }), []);
  const loadPhoto = async (uri: string) => {
    const token = ++request.current; setSampling(false); setPixels(null); setStatus('사진을 읽는 중…');
    try { const photo = await imagePixels(uri); if (mounted.current && token === request.current) { setPixels(photo); setSampling(true); setStatus('사진에서 원하는 색을 터치하세요.'); } }
    catch { if (mounted.current && token === request.current) setStatus('이 사진은 색을 읽을 수 없어요. 다른 사진을 선택하거나 HEX 색상을 입력하세요.'); }
  };
  const pickPhoto = async () => {
    if (picking.current) return;
    picking.current = true;
    try {
      if (Platform.OS !== 'web' && !(await ImagePicker.requestMediaLibraryPermissionsAsync()).granted) { if (mounted.current) setStatus('사진 접근 권한을 허용하거나 HEX 색상을 입력하세요.'); return; }
      if (!mounted.current) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false });
      if (!result.canceled && result.assets[0] && mounted.current) await loadPhoto(result.assets[0].uri);
    } catch { if (mounted.current) setStatus('사진을 열지 못했어요. HEX 색상을 입력할 수 있습니다.'); }
    finally { picking.current = false; }
  };
  const systemDropper = Platform.OS === 'web' && typeof window !== 'undefined' ? (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper : undefined;
  return <View style={styles.container}>
    <View style={styles.current}><View style={[styles.sample, { backgroundColor: color }]} /><Text style={styles.label}>현재 색 · {normalizeColor(value)} → {color}</Text></View>
    <View style={styles.palette}>{(allowTransparent ? ['transparent', ...common] : common).map(item => <Pressable key={item} accessibilityRole="button" accessibilityLabel={item === 'transparent' ? '배경색 없음' : `색상 ${item}`} accessibilityState={{ selected: color === item }} onPress={() => choose(item)} style={[styles.swatch, { backgroundColor: item }, color === item && styles.selected]}>{item === 'transparent' && <Ionicons name="remove" size={18} color={COLORS.text} />}</Pressable>)}</View>
    <Text style={styles.hint}>다양한 색 · 채도와 밝기</Text>
    <View ref={spectrumView} collapsable={false} style={styles.spectrum} {...spectrumGesture.panHandlers}>
      <LinearGradient colors={['#FFFFFF', hsvColor(hue, 1, 1)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', '#000000']} style={StyleSheet.absoluteFill} />
      <Pressable accessibilityLabel="채도와 밝기 선택" style={StyleSheet.absoluteFill} onPress={event => point(event, spectrumView, (x, y) => choose(hsvColor(hue, x, 1 - y)))} />
    </View>
    <View ref={hueView} collapsable={false} style={styles.hue} {...hueGesture.panHandlers}>
      <LinearGradient colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <Pressable accessibilityRole="adjustable" accessibilityLabel="색조 선택" accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={({ nativeEvent }) => setHue(current => (current + (nativeEvent.actionName === 'increment' ? 15 : 345)) % 360)} style={StyleSheet.absoluteFill} onPress={event => point(event, hueView, x => { const next = Math.min(359, x * 360); setHue(next); choose(hsvColor(next, 1, 1)); })} />
    </View>
    <View style={styles.current}><TextInput accessibilityLabel="HEX 색상" value={hex} onChangeText={setHex} autoCapitalize="characters" maxLength={7} placeholder="#RRGGBB" placeholderTextColor={COLORS.subText} style={styles.hex} /><Pressable accessibilityRole="button" accessibilityLabel="HEX 색상 선택" disabled={!/^#[0-9a-f]{6}$/i.test(hex)} onPress={() => choose(hex.toUpperCase())} style={styles.action}><Text style={styles.label}>선택</Text></Pressable></View>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="사진 스포이드" onPress={() => { if (images[0]) void loadPhoto(images[0]); else void pickPhoto(); }} style={styles.action}><Ionicons name="eyedrop-outline" size={18} color={COLORS.text} /><Text style={styles.label}>사진 스포이드</Text></Pressable>
      <Pressable onPress={pickPhoto} style={styles.action}><Text style={styles.label}>다른 사진</Text></Pressable>
      {systemDropper && <Pressable accessibilityRole="button" accessibilityLabel="화면 스포이드" onPress={async () => { try { const result = await new systemDropper().open(); if (mounted.current) choose(result.sRGBHex.toUpperCase()); } catch { /* User cancellation preserves color. */ } }} style={styles.action}><Text style={styles.label}>화면 스포이드</Text></Pressable>}
    </View>
    {sampling && pixels && <Pressable ref={photoView} collapsable={false} accessibilityLabel="사진 픽셀 색 선택" onPress={event => point(event, photoView, (x, y) => { const next = pixelColor(pixels, x, y); choose(next); setStatus(`추출 색 ${next}`); })} style={{ width: '100%', aspectRatio: pixels.width / pixels.height }}><View pointerEvents="none" style={StyleSheet.absoluteFill}><Image source={{ uri: pixels.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" /></View></Pressable>}
    {!!status && <Text style={styles.hint}>{status}</Text>}
    <PrimaryButton label="색상 적용" size="small" onPress={() => onChange(color)} />
  </View>;
}
const styles = StyleSheet.create({ container: { gap: 10 }, current: { flexDirection: 'row', alignItems: 'center', gap: 10 }, label: { ...TYPOGRAPHY.labelMedium, color: COLORS.text, flexShrink: 1 }, hint: { ...TYPOGRAPHY.caption, color: COLORS.subText }, sample: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border }, palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, swatch: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }, selected: { borderColor: COLORS.primary, borderWidth: 3 }, spectrum: { height: 120, borderRadius: 8, overflow: 'hidden' }, hue: { height: 40, borderRadius: 8, overflow: 'hidden' }, hex: { ...TYPOGRAPHY.bodyMedium, color: COLORS.text, minHeight: 44, flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border }, actions: { flexDirection: 'row', flexWrap: 'wrap' }, action: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 } });
