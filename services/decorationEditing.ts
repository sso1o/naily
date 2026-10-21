import type { DecoratedPostImage, ImageDecoration } from '@/types/models';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export function cloneImage(image: DecoratedPostImage): DecoratedPostImage {
  return { ...image, ...(image.photoTransform ? { photoTransform: { ...image.photoTransform } } : {}), decorations: image.decorations.map(item => ({ ...item, ...(item.points ? { points: item.points.map(point => ({ ...point })) } : {}), ...(item.gradientColors ? { gradientColors: [...item.gradientColors] as ImageDecoration['gradientColors'] } : {}) })) };
}
export function patchDecoration(image: DecoratedPostImage, id: string, patch: Partial<ImageDecoration>) {
  return { ...image, decorations: image.decorations.map(item => item.id === id ? { ...item, ...patch } : item) };
}
export function orderedDecorations(items: ImageDecoration[]) {
  return items.map((item, index) => ({ item, index })).sort((a, b) => (a.item.layer ?? a.index) - (b.item.layer ?? b.index) || a.index - b.index).map(({ item }) => item);
}
export function bringToFront(image: DecoratedPostImage, id: string) {
  const ordered = orderedDecorations(image.decorations);
  if (ordered.at(-1)?.id === id) return image;
  return { ...image, decorations: [...ordered.filter(item => item.id !== id), ...ordered.filter(item => item.id === id)].map((item, layer) => ({ ...item, layer })) };
}
export type Point = { x: number; y: number };
export function touchGeometry(points: Point[]) {
  const a = points[0] ?? { x: 0, y: 0 }, b = points[1] ?? a;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
}
export function transformDecoration(base: ImageDecoration, from: Point[], to: Point[], frame: { width: number; height: number; boxHeight?: number }) {
  const a = touchGeometry(from), b = touchGeometry(to);
  const angle = ((b.angle - a.angle + 540) % 360) - 180;
  const halfWidth = (base.width ?? 0.76) / 2;
  const halfHeight = (frame.boxHeight ? frame.boxHeight / Math.max(1, frame.height) : base.height ?? 0.14) / 2;
  return {
    // Keep the transform center inside the photo, even for long or rotated text.
    x: clamp(base.x + (b.x - a.x) / Math.max(1, frame.width), -halfWidth + 0.03, 1 - halfWidth - 0.03),
    y: clamp(base.y + (b.y - a.y) / Math.max(1, frame.height), -halfHeight + 0.03, 1 - halfHeight - 0.03),
    scale: clamp((base.scale ?? 1) * (from.length > 1 && to.length > 1 && a.distance > 2 ? b.distance / a.distance : 1), 0.35, 3),
    rotation: (base.rotation ?? 0) + (from.length > 1 && to.length > 1 ? angle : 0),
  };
}
export function transformPhoto(base: NonNullable<DecoratedPostImage['photoTransform']>, from: Point[], to: Point[], frame: { width: number; height: number }) {
  const a = touchGeometry(from), b = touchGeometry(to);
  return {
    x: clamp(base.x + (b.x - a.x) / Math.max(1, frame.width), -1, 1),
    y: clamp(base.y + (b.y - a.y) / Math.max(1, frame.height), -1, 1),
    scale: clamp(base.scale * (from.length > 1 && to.length > 1 && a.distance > 2 ? b.distance / a.distance : 1), 0.5, 4),
    rotation: base.rotation + (from.length > 1 && to.length > 1 ? ((b.angle - a.angle + 540) % 360) - 180 : 0),
  };
}
export function appendStroke(points: Point[], point: Point, frame: { width: number; height: number }) {
  const next = { x: clamp(point.x / Math.max(1, frame.width), 0, 1), y: clamp(point.y / Math.max(1, frame.height), 0, 1) };
  const last = points.at(-1);
  if (last && Math.hypot((last.x - next.x) * frame.width, (last.y - next.y) * frame.height) < 1.5) return points;
  return points.length < 2048 ? [...points, next] : [...points.slice(0, -1), next];
}
export function strokePath(points: Point[], frame: { width: number; height: number }) {
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${(point.x * frame.width).toFixed(2)},${(point.y * frame.height).toFixed(2)}`).join(' ');
  return points.length === 1 ? `${path} l0.01,0` : path;
}
export type DecorationHistory = { past: DecoratedPostImage[]; present: DecoratedPostImage; future: DecoratedPostImage[] };
export function commitDecoration(history: DecorationHistory, next: DecoratedPostImage): DecorationHistory {
  if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
  return { past: [...history.past, history.present].slice(-40), present: next, future: [] };
}
export function undoDecoration(history: DecorationHistory): DecorationHistory {
  if (!history.past.length) return history;
  return { past: history.past.slice(0, -1), present: history.past.at(-1)!, future: [history.present, ...history.future] };
}
export function redoDecoration(history: DecorationHistory): DecorationHistory {
  if (!history.future.length) return history;
  return { past: [...history.past, history.present].slice(-40), present: history.future[0], future: history.future.slice(1) };
}
