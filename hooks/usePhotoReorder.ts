import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, BackHandler, Keyboard, PanResponder, Platform, type GestureResponderEvent, type ScrollView, type View } from 'react-native';
import { refreshHaptic } from '@/services/refreshHaptic';
import { edgeScrollSpeed, insertionTarget, moveBlockBefore, moveBlockIntoText, type TextDrop } from '@/services/documentEditing';
import type { PostBlock } from '@/types/models';

export function usePhotoReorder(blocks: PostBlock[], onChange: Dispatch<SetStateAction<PostBlock[]>>, disabled: boolean, locate?: (id: string, x: number, y: number) => Promise<Omit<TextDrop, 'id'> | null>) {
  const scroll = useRef<ScrollView>(null);
  const viewport = useRef<View>(null);
  const layouts = useRef(new Map<string, { y: number; height: number }>());
  const metrics = useRef({ left: 0, top: 0, height: 0, offset: 0, content: 0, blocksTop: 0 });
  const latest = useRef({ blocks, onChange, disabled, locate }); latest.current = { blocks, onChange, disabled, locate };
  const [drag, setDrag] = useState<{ id: string; before: string | null; dy: number; drop?: TextDrop } | null>(null);
  const active = useRef<{ id: string; before: string | null; startY: number; startOffset: number; x: number; y: number; drop?: TextDrop; lookup?: Promise<TextDrop | null>; probe?: string } | null>(null);
  const generation = useRef(0);
  const pending = useRef<{ id: string; x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const lastTick = useRef<number | null>(null);
  const clearPending = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; pending.current = null; };
  const finish = useCallback((commit: boolean) => {
    clearPending();
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    lastTick.current = null;
    const current = active.current; active.current = null;
    setDrag(null);
    if (!commit) generation.current++;
    if (commit && current && !latest.current.disabled) {
      const token = generation.current;
      const apply = (drop: TextDrop | null) => { if (token === generation.current && !latest.current.disabled) latest.current.onChange(blocks => drop ? moveBlockIntoText(blocks, current.id, drop) : moveBlockBefore(blocks, current.id, current.before)); };
      if (current.lookup) void current.lookup.then(apply); else apply(null);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => { if (!active.current) return false; finish(false); return true; });
    const app = AppState.addEventListener('change', state => { if (state !== 'active') finish(false); });
    return () => { back.remove(); app.remove(); finish(false); };
  }, [finish]));
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const end = () => finish(true), cancel = () => finish(false);
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel); };
  }, [finish]);
  const update = () => {
    const current = active.current;
    if (!current) return;
    const m = metrics.current;
    current.before = insertionTarget(latest.current.blocks, current.id, current.y - m.top + m.offset - m.blocksTop, layouts.current);
    const y = current.y - m.top + m.offset - m.blocksTop;
    const target = latest.current.blocks.find(block => { const layout = layouts.current.get(block.id); return block.id !== current.id && ['text', 'heading'].includes(block.type) && layout && y >= layout.y && y <= layout.y + layout.height; });
    const render = () => setDrag({ id: current.id, before: current.before, dy: current.y - current.startY + m.offset - current.startOffset, drop: current.drop });
    if (target && latest.current.locate) {
      const layout = layouts.current.get(target.id)!;
      const probe = `${target.id}:${current.x}:${y}`;
      if (current.probe === probe) { render(); return; }
      current.probe = probe;
      if (current.drop?.id !== target.id) current.drop = undefined;
      const lookup = latest.current.locate(target.id, current.x - m.left - 20, y - layout.y).then(hit => hit ? { id: target.id, ...hit } : null).catch(() => null);
      current.lookup = lookup;
      void lookup.then(drop => { if (active.current === current && current.lookup === lookup) { current.drop = drop ?? undefined; render(); } });
    } else { current.drop = undefined; current.lookup = undefined; current.probe = undefined; }
    render();
  };
  const tick = (time: number) => {
    if (!active.current) return;
    const m = metrics.current;
    // Same speed on 60/120Hz displays; do not jump after a stalled frame.
    const elapsed = lastTick.current === null ? 16.67 : Math.min(32, Math.max(0, time - lastTick.current));
    lastTick.current = time;
    const next = Math.max(0, Math.min(Math.max(0, m.content - m.height), m.offset + edgeScrollSpeed(active.current.y - m.top, m.height) * elapsed / 16.67));
    if (next !== m.offset) { m.offset = next; scroll.current?.scrollTo({ y: next, animated: false }); update(); }
    frame.current = requestAnimationFrame(tick);
  };
  const begin = (id: string, event: GestureResponderEvent) => {
    if (latest.current.disabled || active.current || event.nativeEvent.touches.length > 1) return;
    clearPending();
    const { pageX: x, pageY: y } = event.nativeEvent;
    pending.current = { id, x, y };
    // Native edge-back remains owned by the navigator; handles are inset 28dp.
    timer.current = setTimeout(() => {
      if (!pending.current || latest.current.disabled) return;
      const p = pending.current; clearPending(); Keyboard.dismiss();
      generation.current++;
      active.current = { id, before: id, startY: p.y, startOffset: metrics.current.offset, x: p.x, y: p.y };
      setDrag({ id, before: id, dy: 0 }); void refreshHaptic();
      frame.current = requestAnimationFrame(tick);
    }, 300);
  };
  const moveTouch = (event: GestureResponderEvent) => {
    if (event.nativeEvent.touches.length > 1) { finish(false); return; }
    if (active.current) { active.current.x = event.nativeEvent.pageX; active.current.y = event.nativeEvent.pageY; update(); }
    else if (pending.current && Math.hypot(event.nativeEvent.pageX - pending.current.x, event.nativeEvent.pageY - pending.current.y) > 8) clearPending();
  };
  const handlers = useRef({ moveTouch, finish }); handlers.current = { moveTouch, finish };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: event => { if (event.nativeEvent.touches.length > 1) handlers.current.finish(false); return false; },
    onMoveShouldSetPanResponderCapture: event => { handlers.current.moveTouch(event); return Boolean(active.current); },
    onPanResponderMove: event => handlers.current.moveTouch(event),
    onPanResponderRelease: () => handlers.current.finish(true),
    // Once activated, a programmatic auto-scroll must not steal the responder.
    // OS cancellation still invokes Terminate, regardless of this negotiation.
    onPanResponderTerminationRequest: () => !active.current,
    onPanResponderReject: () => handlers.current.finish(false),
    onPanResponderTerminate: () => handlers.current.finish(false),
  }), []);
  return { scroll, viewport, metrics, layouts, drag, finish, panHandlers: responder.panHandlers,
    handleProps: (id: string) => ({
      onStartShouldSetResponderCapture: (event: GestureResponderEvent) => { begin(id, event); return false; },
      onTouchMove: moveTouch,
      onTouchEnd: () => finish(true),
      onTouchCancel: () => finish(false),
      // React Native Web translates mouse starts/moves into responder touch events.
      onStartShouldSetResponder: (event: GestureResponderEvent) => { begin(id, event); return false; },
    }),
    measure: () => viewport.current?.measureInWindow((x, y, _width, height) => { metrics.current.left = x; metrics.current.top = y; metrics.current.height = height; }),
  };
}
