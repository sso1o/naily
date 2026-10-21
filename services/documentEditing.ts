import type { PostBlock } from '@/types/models';
import { insertPostBlock } from './postBlocks';

export type TextDrop = { id: string; offset: number; top: number; left?: number; height?: number };
let splitSequence = 0;
export function moveBlockIntoText(blocks: PostBlock[], id: string, target: TextDrop) {
  const moving = blocks.find(block => block.id === id);
  const destination = blocks.find(block => block.id === target.id);
  if (!moving || !destination || id === target.id || !['text', 'heading'].includes(destination.type)) return blocks;
  return insertPostBlock(blocks.filter(block => block.id !== id), moving, target, `${id}-move-${++splitSequence}`);
}

export const imageWidthRatio = (ratio?: number) => Math.max(0.35, Math.min(1, Number.isFinite(ratio) ? ratio! : 1));

/** Target is an ID in the document with the moving block removed; null means end. */
export function moveBlockBefore(blocks: PostBlock[], id: string, before: string | null) {
  const moving = blocks.find(block => block.id === id);
  if (!moving || before === id || (before !== null && !blocks.some(block => block.id === before))) return blocks;
  const rest = blocks.filter(block => block.id !== id);
  rest.splice(before === null ? rest.length : rest.findIndex(block => block.id === before), 0, moving);
  return rest.every((block, index) => block === blocks[index]) ? blocks : rest;
}

export function insertionTarget(blocks: PostBlock[], id: string, y: number, layouts: Map<string, { y: number; height: number }>) {
  return blocks.find(block => {
    const layout = layouts.get(block.id);
    return block.id !== id && layout && y < layout.y + layout.height / 2;
  })?.id ?? null;
}

export function edgeScrollSpeed(y: number, height: number) {
  const edge = Math.min(64, height / 4);
  return y < edge ? -Math.min(6, Math.max(0, (edge - y) / edge) * 6)
    : y > height - edge ? Math.min(6, Math.max(0, (y - height + edge) / edge) * 6) : 0;
}
