import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Dimensions, PanResponder, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { DecoratedPostImage } from '@/types/models';
import { appendStroke, strokePath, transformPhoto, type Point } from '@/services/decorationEditing';

type Props = {
  width: number; height: number; drawing: boolean; photoMode: boolean;
  transform?: DecoratedPostImage['photoTransform']; color: string; strokeWidth: number;
  onSelect: () => void; onPhotoChange?: (transform: NonNullable<DecoratedPostImage['photoTransform']>) => void;
  onStroke?: (points: Point[]) => void; onGestureStart?: () => void; onGestureEnd?: (cancelled: boolean) => void;
};
const touchPoints = (event: GestureResponderEvent) => [...event.nativeEvent.touches].sort((a, b) => Number(a.identifier) - Number(b.identifier)).slice(0, 2).map(t => ({ x: t.pageX, y: t.pageY }));
export default function PhotoCanvasGestures(props: Props) {
  const latest = useRef(props); latest.current = props;
  const [preview, setPreview] = useState<Point[]>([]);
  const session = useRef<{ drawing: boolean; photo: boolean; cancelled: boolean; points: Point[]; from: Point[]; base: NonNullable<DecoratedPostImage['photoTransform']>; last: NonNullable<DecoratedPostImage['photoTransform']> } | null>(null);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' || !session.current) return;
      const s = session.current; session.current = null; setPreview([]);
      if (s.drawing || s.photo) latest.current.onGestureEnd?.(true);
    });
    return () => subscription.remove();
  }, []);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: e => e.nativeEvent.pageX > 24 && e.nativeEvent.pageX < Dimensions.get('window').width - 24,
    onMoveShouldSetPanResponder: () => Boolean(session.current),
    onPanResponderGrant: event => {
      const p = latest.current;
      const base = p.transform ?? { x: 0, y: 0, scale: 1, rotation: 0 };
      const points = p.drawing ? appendStroke([], { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }, p) : [];
      session.current = { drawing: p.drawing, photo: p.photoMode, cancelled: false, points, base, last: base, from: touchPoints(event) };
      if (p.drawing || p.photoMode) p.onGestureStart?.();
      setPreview(points);
    },
    onPanResponderMove: event => {
      const s = session.current, p = latest.current;
      if (!s || s.cancelled) return;
      if (s.drawing) {
        if (event.nativeEvent.touches.length > 1) { s.cancelled = true; setPreview([]); return; }
        s.points = appendStroke(s.points, { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }, p); setPreview(s.points);
      } else if (s.photo) {
        const to = touchPoints(event); if (!to.length) return;
        if (to.length !== s.from.length) { s.base = s.last; s.from = to; return; }
        s.last = transformPhoto(s.base, s.from, to, p); p.onPhotoChange?.(s.last);
      }
    },
    onPanResponderRelease: () => {
      const s = session.current; session.current = null; setPreview([]);
      if (!s) return;
      const p = latest.current;
      if (s.drawing || s.photo) p.onGestureEnd?.(s.cancelled);
      if (s.drawing && !s.cancelled && s.points.length) p.onStroke?.(s.points);
      if (!s.drawing && !s.photo) p.onSelect();
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderTerminate: () => { const s = session.current; session.current = null; setPreview([]); if (s?.drawing || s?.photo) latest.current.onGestureEnd?.(true); },
  }), []);
  return <View style={StyleSheet.absoluteFill} {...responder.panHandlers} accessibilityLabel={props.drawing ? '사진 위 그리기 캔버스' : props.photoMode ? '사진 이동 확대 회전 캔버스' : '사진 캔버스'}>
    {preview.length > 0 && <Svg pointerEvents="none" width={props.width} height={props.height}><Path d={strokePath(preview, props)} fill="none" stroke={props.color} strokeWidth={props.strokeWidth * props.width / 390} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
  </View>;
}
