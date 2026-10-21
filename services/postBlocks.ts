import type { PostBlock } from '@/types/models';
import { textRuns } from './richWriting';

/** Split authored runs at a caret; new IDs remount only for explicit insertion. */
export function insertPostBlock(blocks: PostBlock[], block: PostBlock, anchor?: { id: string; offset?: number }, splitKey = block.id): PostBlock[] {
  const index = blocks.findIndex(item => item.id === anchor?.id);
  if (index < 0) return [...blocks, block, { id: `${block.id}-tail`, type: 'text', content: '' }];
  const source = blocks[index];
  if (!['text', 'heading'].includes(source.type) || anchor?.offset === undefined) return [...blocks.slice(0, index + 1), block, { id: `${block.id}-tail`, type: 'text', content: '' }, ...blocks.slice(index + 1)];
  const offset = Math.max(0, Math.min(source.content?.length ?? 0, anchor.offset));
  const before = [], after = []; let position = 0;
  for (const run of textRuns(source)) {
    const cut = Math.max(0, Math.min(run.text.length, offset - position));
    if (cut) before.push({ ...run, text: run.text.slice(0, cut) });
    if (cut < run.text.length) after.push({ ...run, text: run.text.slice(cut) });
    position += run.text.length;
  }
  return [...blocks.slice(0, index), { ...source, id: `${splitKey}-head`, content: before.map(run => run.text).join(''), runs: before }, block, { ...source, id: `${splitKey}-tail`, content: after.map(run => run.text).join(''), runs: after }, ...blocks.slice(index + 1)];
}
