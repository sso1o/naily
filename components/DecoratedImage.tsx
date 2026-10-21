import { useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, LayoutChangeEvent, PanResponder, StyleProp, StyleSheet, Text, View, ViewStyle, type GestureResponderEvent } from 'react-native';
import { COLORS } from '@/constants/colors';
import { DecoratedPostImage, ImageDecoration } from '@/types/models';
import { clamp, orderedDecorations, transformDecoration, type Point } from '@/services/decorationEditing';
import HomeImage from './home/HomeImage';
import Svg, { Path } from 'react-native-svg';
import PhotoCanvasGestures from './PhotoCanvasGestures';
import { strokePath } from '@/services/decorationEditing';

type Props = {
  image: DecoratedPostImage; style?: StyleProp<ViewStyle>; fallbackLabel?: string; editable?: boolean; selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChangeDecoration?: (id: string, patch: Partial<ImageDecoration>) => void;
  onGestureStart?: () => void; onGestureEnd?: (cancelled: boolean) => void; onEditText?: (id: string) => void;
  drawing?: boolean; photoMode?: boolean; brushColor?: string; brushWidth?: number;
  onStroke?: (points: Point[]) => void;
  onChangePhoto?: (transform: NonNullable<DecoratedPostImage['photoTransform']>) => void;
};
type DecorationProps = Omit<Props, 'image' | 'style' | 'fallbackLabel' | 'selectedId'> & { decoration: ImageDecoration; frameWidth: number; frameHeight: number; selected: boolean };
function colorWithOpacity(color: string, opacity = 1) {
  if (!color.startsWith('#')) return color;
  const normalized = color.length === 4 ? color.slice(1).split('').map(c => c + c).join('') : color.slice(1, 7);
  const value = Number.parseInt(normalized, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${clamp(opacity, 0, 1)})`;
}
export function hasDecorationTitle(image?: DecoratedPostImage) {
  return Boolean(image?.decorations.some(item => item.type === 'text' && item.role === 'title' && item.text?.trim()));
}
function points(event: GestureResponderEvent): Point[] {
  return [...event.nativeEvent.touches].sort((a, b) => Number(a.identifier) - Number(b.identifier)).slice(0, 2).map(t => ({ x: t.pageX, y: t.pageY }));
}
function DecorationLayer(props: DecorationProps) {
  const { decoration, frameWidth, frameHeight, editable, selected } = props;
  const latest = useRef(props); latest.current = props;
  const boxHeight = useRef(0);
  const session = useRef<{ base: ImageDecoration; last: ImageDecoration; from: Point[]; selected: boolean; moved: boolean } | null>(null);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: e => Boolean(latest.current.editable && e.nativeEvent.pageX > 24 && e.nativeEvent.pageX < Dimensions.get('window').width - 24),
    onMoveShouldSetPanResponder: () => Boolean(session.current),
    onPanResponderGrant: e => {
      const p = latest.current;
      session.current = { base: p.decoration, last: p.decoration, from: points(e), selected: p.selected, moved: false };
      p.onGestureStart?.(); p.onSelect?.(p.decoration.id);
    },
    onPanResponderMove: e => {
      const s = session.current, p = latest.current, to = points(e);
      if (!s || !to.length) return;
      // Rebase when a second finger joins/leaves, avoiding a centroid jump.
      if (to.length !== s.from.length) { s.base = s.last; s.from = to; s.moved = true; return; }
      if (!s.moved && to.length === 1 && Math.hypot(to[0].x - s.from[0].x, to[0].y - s.from[0].y) < 4) return;
      s.moved = true;
      const patch = transformDecoration(s.base, s.from, to, { width: p.frameWidth, height: p.frameHeight, boxHeight: boxHeight.current });
      s.last = { ...s.base, ...patch }; p.onChangeDecoration?.(p.decoration.id, patch);
    },
    onPanResponderRelease: () => {
      const s = session.current; session.current = null;
      latest.current.onGestureEnd?.(false);
      if (s?.selected && !s.moved && s.base.type === 'text') latest.current.onEditText?.(s.base.id);
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderTerminate: () => { session.current = null; latest.current.onGestureEnd?.(true); },
  }), []);
  const widthRatio = clamp(decoration.width ?? 0.76, 0.12, 1);
  const heightRatio = clamp(decoration.height ?? (decoration.type === 'gradient' ? 0.52 : 0.14), 0.04, 1);
  // Legacy overlays retain their exact old metrics; v2 scales padding and font together.
  const v2 = decoration.coordinateVersion === 2;
  const fontScale = v2 ? frameWidth / 390 : clamp(frameWidth / 390, 0.62, 1.45);
  const metricScale = v2 ? fontScale : 1;
  const position: ViewStyle = {
    position: 'absolute', left: decoration.x * frameWidth, top: decoration.y * frameHeight, width: widthRatio * frameWidth,
    transform: [{ rotate: `${decoration.rotation ?? 0}deg` }, { scale: decoration.scale ?? 1 }],
  };
  const selection = selected ? <View pointerEvents="none" style={styles.selected} /> : null;
  const handlers = editable ? responder.panHandlers : {};
  return <View {...handlers} accessible={editable} accessibilityRole={editable ? 'button' : undefined} accessibilityLabel={editable ? `${decoration.type === 'text' ? decoration.text || '빈 텍스트' : '장식'} 선택` : undefined} accessibilityState={editable ? { selected } : undefined}
    accessibilityActions={editable ? [{ name: 'activate', label: '선택 또는 내용 수정' }] : undefined}
    onAccessibilityAction={() => { if (selected && decoration.type === 'text') props.onEditText?.(decoration.id); else props.onSelect?.(decoration.id); }}
    onLayout={({ nativeEvent }) => { boxHeight.current = nativeEvent.layout.height; }}
    hitSlop={editable ? { top: 22 / (decoration.scale ?? 1), bottom: 22 / (decoration.scale ?? 1), left: 22 / (decoration.scale ?? 1), right: 22 / (decoration.scale ?? 1) } : undefined}
    pointerEvents={editable ? 'auto' : 'none'}
    style={[position, decoration.type === 'text' ? {
      minHeight: Math.max(34 * metricScale, heightRatio * frameHeight), justifyContent: 'center', paddingHorizontal: 10 * metricScale, paddingVertical: 5 * metricScale,
      borderRadius: (decoration.borderRadius ?? 8) * metricScale,
      backgroundColor: decoration.backgroundColor ? colorWithOpacity(decoration.backgroundColor, decoration.backgroundOpacity ?? 0.72) : 'transparent',
    } : { height: heightRatio * frameHeight }, decoration.type === 'shape' && {
      borderRadius: (decoration.borderRadius ?? 12) * metricScale, backgroundColor: colorWithOpacity(decoration.backgroundColor ?? '#111111', decoration.backgroundOpacity ?? 0.6), opacity: decoration.opacity ?? 1,
    }]}>
    {decoration.type === 'gradient' && <LinearGradient colors={decoration.gradientColors ?? ['rgba(16, 10, 12, 0)', 'rgba(16, 10, 12, 0.78)']} style={StyleSheet.absoluteFill} />}
    {decoration.type === 'drawing' && <Svg width={frameWidth} height={frameHeight}><Path d={strokePath(decoration.points ?? [], { width: frameWidth, height: frameHeight })} fill="none" stroke={decoration.color ?? '#FFFFFF'} strokeWidth={(decoration.strokeWidth ?? 4) * frameWidth / 390} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
    {decoration.type === 'text' && <Text numberOfLines={decoration.maxLines} style={{ color: decoration.color ?? '#FFFFFF', fontSize: (decoration.fontSize ?? 24) * fontScale, lineHeight: (decoration.fontSize ?? 24) * fontScale * 1.24, fontWeight: decoration.fontWeight ?? '700', textAlign: decoration.textAlign ?? 'left' }}>{decoration.text}</Text>}
    {selection}
  </View>;
}
export default function DecoratedImage({ image, style, fallbackLabel = 'NAILY', editable = false, selectedId, drawing = false, photoMode = false, brushColor = '#FFFFFF', brushWidth = 4, onStroke, onChangePhoto, ...callbacks }: Props) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame(current => current.width === width && current.height === height ? current : { width, height });
  };
  return <View onLayout={handleLayout} style={[styles.frame, image.aspectRatio ? { aspectRatio: image.aspectRatio } : null, style]}>
    <View style={[StyleSheet.absoluteFill, image.photoTransform && { transform: [{ translateX: image.photoTransform.x * frame.width }, { translateY: image.photoTransform.y * frame.height }, { rotate: `${image.photoTransform.rotation}deg` }, { scale: image.photoTransform.scale }] }]}><HomeImage uri={image.uri} fallbackLabel={fallbackLabel} style={StyleSheet.absoluteFill} /></View>
    {editable && !drawing && <PhotoCanvasGestures width={frame.width} height={frame.height} drawing={false} photoMode={photoMode} transform={image.photoTransform} color={brushColor} strokeWidth={brushWidth} onSelect={() => callbacks.onSelect?.(null)} onPhotoChange={onChangePhoto} onGestureStart={callbacks.onGestureStart} onGestureEnd={callbacks.onGestureEnd} />}
    {frame.width > 0 && orderedDecorations(image.decorations).map(decoration => <DecorationLayer key={decoration.id} decoration={decoration} editable={editable && !drawing && !photoMode && (decoration.type !== 'drawing' || selectedId === decoration.id)} frameWidth={frame.width} frameHeight={frame.height} selected={editable && selectedId === decoration.id} {...callbacks} />)}
    {editable && drawing && <PhotoCanvasGestures width={frame.width} height={frame.height} drawing photoMode={false} color={brushColor} strokeWidth={brushWidth} onSelect={() => {}} onStroke={onStroke} onGestureStart={callbacks.onGestureStart} onGestureEnd={callbacks.onGestureEnd} />}
  </View>;
}
const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: COLORS.lightPink },
  selected: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 4 },
});
