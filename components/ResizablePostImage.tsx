import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, PanResponder, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DecoratedImage from './DecoratedImage';
import type { PostBlock } from '@/types/models';
import { imageWidthRatio } from '@/services/documentEditing';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/typography';

export default function ResizablePostImage({ block, selected, disabled, onChange, onSelect, dragProps }: { block: PostBlock; selected: boolean; disabled?: boolean; onChange: (widthRatio: number) => void; onSelect: () => void; dragProps: ViewProps }) {
  const [preview, setPreview] = useState<number | null>(null);
  const width = useRef(1);
  const gesture = useRef<{ ratio: number; distance: number } | null>(null);
  const current = useRef({ block, disabled, onChange }); current.current = { block, disabled, onChange };
  const pending = useRef<number | null>(null);
  const distance = (touches: readonly { pageX: number; pageY: number }[]) => Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
  const finish = (cancel = false) => { if (!cancel && !current.current.disabled && pending.current !== null) current.current.onChange(pending.current); pending.current = null; gesture.current = null; setPreview(null); };
  useEffect(() => { const sub = AppState.addEventListener('change', state => { if (state !== 'active') finish(true); }); return () => sub.remove(); }, []);
  const update = (ratio: number) => { pending.current = imageWidthRatio(ratio); setPreview(pending.current); };
  const pinch = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: event => !current.current.disabled && event.nativeEvent.touches.length === 2,
    onMoveShouldSetPanResponderCapture: event => !current.current.disabled && event.nativeEvent.touches.length === 2,
    onPanResponderGrant: event => { if (event.nativeEvent.touches.length === 2) gesture.current = { ratio: imageWidthRatio(current.current.block.widthRatio), distance: Math.max(1, distance(event.nativeEvent.touches)) }; },
    onPanResponderMove: event => { if (gesture.current && event.nativeEvent.touches.length === 2) update(gesture.current.ratio * distance(event.nativeEvent.touches) / gesture.current.distance); },
    onPanResponderRelease: () => finish(), onPanResponderTerminate: () => finish(true), onPanResponderTerminationRequest: () => false,
  }), []);
  const handle = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !current.current.disabled,
    onPanResponderGrant: () => { gesture.current = { ratio: imageWidthRatio(current.current.block.widthRatio), distance: 0 }; },
    onPanResponderMove: (_event, state) => { if (gesture.current) update(gesture.current.ratio + state.dx * 2 / width.current); },
    onPanResponderRelease: () => finish(), onPanResponderTerminate: () => finish(true), onPanResponderTerminationRequest: () => false,
  }), []);
  return <View onLayout={({ nativeEvent }) => { width.current = nativeEvent.layout.width; }}>
    <View style={styles.area}><View {...pinch.panHandlers} style={styles.area}>
      <View style={{ width: `${(preview ?? imageWidthRatio(block.widthRatio)) * 100}%` }}>
        <Pressable {...dragProps} accessibilityLabel="사진 선택" accessibilityHint="길게 눌러 글 사이로 이동하고, 두 손가락으로 크기를 조절할 수 있어요" disabled={disabled} onPress={onSelect}>
          <DecoratedImage image={block.decoratedImage ?? { uri: block.imageUrl ?? '', aspectRatio: 4 / 3, decorations: [] }} style={styles.image} fallbackLabel="POST" />
        </Pressable>
        {selected && <View accessible accessibilityRole="adjustable" accessibilityLabel="사진 크기 조절" accessibilityValue={{ min: 35, max: 100, now: Math.round((preview ?? imageWidthRatio(block.widthRatio)) * 100) }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={({ nativeEvent }) => onChange(imageWidthRatio((block.widthRatio ?? 1) + (nativeEvent.actionName === 'increment' ? 0.05 : -0.05)))} style={styles.handle} {...handle.panHandlers}><Ionicons name="resize-outline" size={18} color={COLORS.primary} /></View>}
      </View>
    </View></View>
    {selected && <View style={styles.presets}>{[[0.35, '작게'], [0.55, '중간'], [0.75, '크게'], [1, '최대 너비']].map(([ratio, label]) => <Pressable key={ratio} disabled={disabled} accessibilityRole="button" accessibilityLabel={`사진 ${label}`} onPress={() => onChange(Number(ratio))} style={styles.preset}><Text style={styles.label}>{label}</Text></Pressable>)}</View>}
  </View>;
}
const styles = StyleSheet.create({ area: { width: '100%', alignItems: 'center' }, image: { width: '100%', borderRadius: 8 }, handle: { position: 'absolute', right: -2, bottom: -2, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }, presets: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }, preset: { minHeight: 40, paddingHorizontal: 10, justifyContent: 'center' }, label: { ...TYPOGRAPHY.labelMedium, color: COLORS.subText } });
