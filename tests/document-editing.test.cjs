const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function load(path, mocks = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : /(?:ColorPicker|PrimaryButton|ResizablePostImage)$/.test(name) ? { default: name.split('/').at(-1), __esModule: true } : name === 'expo-font' ? { isLoaded: () => true } : name === '@/services/colorPicking' ? load('services/colorPicking.ts', {}) : name === '@/services/documentEditing' ? load('services/documentEditing.ts', {}) : (name === '@/services/richWriting' || name === './richWriting') ? load('services/richWriting.ts') : name === './postBlocks' ? load('services/postBlocks.ts', {}) : require(name), ...globals });
  return module.exports;
}
const editing = load('services/documentEditing.ts');
const decoration = load('services/decorationEditing.ts');
const original = { uri: 'original-uri', aspectRatio: 0.8, decorations: [{ id: 'overlay', type: 'text', text: '기존 제목', x: 0.08, y: 0.66, fontSize: 30, width: 0.84, height: 0.2 }] };
const blocks = [{ id: 'a', type: 'text', content: '앞 문단' }, { id: 'photo', type: 'image', imageUrl: original.uri, decoratedImage: original }, { id: 'h', type: 'heading', content: '소제목' }, { id: 'd', type: 'divider' }, { id: 'b', type: 'text', content: '뒤 문단' }];

test('mixed block moves preserve identities, metadata, content and no-op boundaries', () => {
  const moved = editing.moveBlockBefore(blocks, 'photo', null);
  assert.equal(moved.map(b => b.id).join(), 'a,h,d,b,photo');
  assert.equal(moved.at(-1), blocks[1]); assert.equal(moved.at(-1).decoratedImage, original);
  const first = editing.moveBlockBefore(moved, 'photo', 'a');
  assert.equal(first.map(b => b.id).join(), 'photo,a,h,d,b');
  assert.equal(editing.moveBlockBefore(first, 'photo', 'a'), first);
  assert.equal(editing.moveBlockBefore(first, 'photo', 'missing'), first);
  assert.equal(blocks[1].id, 'photo');
});

test('insertion targets cross text, heading and divider and edge scroll is bounded', () => {
  const layouts = new Map(blocks.map((b, i) => [b.id, { y: i * 100, height: 80 }]));
  assert.equal(editing.insertionTarget(blocks, 'photo', 250, layouts), 'd');
  assert.equal(editing.insertionTarget(blocks, 'photo', 999, layouts), null);
  assert.equal(editing.edgeScrollSpeed(300, 600), 0);
  assert.equal(editing.edgeScrollSpeed(-20, 600), -6);
  assert.equal(editing.edgeScrollSpeed(620, 600), 6);
});

function reorderFixture(locate) {
  const slots = []; let cursor = 0, timer, frame, cleanup, back, haptics = 0, writes = 0;
  let current = blocks;
  const react = { useRef: v => { const i = cursor++; return slots[i] ??= { current: v }; }, useState: v => { const i = cursor++; if (!(i in slots)) slots[i] = v; return [slots[i], n => { slots[i] = n; }]; }, useCallback: fn => fn, useMemo: fn => { const i = cursor++; return slots[i] ??= fn(); }, useEffect() {} };
  const hook = load('hooks/usePhotoReorder.ts', {
    react, 'expo-router': { useFocusEffect: fn => { cleanup = fn(); } },
    'react-native': { Platform: { OS: 'ios' }, Keyboard: { dismiss() {} }, AppState: { addEventListener: () => ({ remove() {} }) }, BackHandler: { addEventListener: (_, fn) => { back = fn; return { remove() {} }; } }, PanResponder: { create: config => ({ panHandlers: config }) } },
    '@/services/refreshHaptic': { refreshHaptic: () => { haptics++; } }, '@/services/documentEditing': editing,
  }, { setTimeout: (fn, delay) => { assert.equal(delay, 300); timer = fn; return 1; }, clearTimeout: () => { timer = null; }, requestAnimationFrame: fn => { frame = fn; return 1; }, cancelAnimationFrame: () => { frame = null; } }).usePhotoReorder;
  const render = () => { cursor = 0; return hook(current, fn => { writes++; current = fn(current); }, false, locate); };
  let result = render();
  result.metrics.current = { left: 0, top: 50, height: 600, offset: 0, content: 1300, blocksTop: 0 };
  result.layouts.current = new Map(blocks.map((b, i) => [b.id, { y: i * 100, height: 80 }]));
  return { render, start: () => result.handleProps('photo').onStartShouldSetResponder(event(200)), activate: () => timer?.(), move: y => result.panHandlers.onMoveShouldSetPanResponderCapture(event(y)), end: () => result.panHandlers.onPanResponderRelease(), cancel: () => result.panHandlers.onPanResponderTerminate(), blur: () => cleanup(), back: () => back(), tick: (time = 0) => frame?.(time), current: () => current, haptics: () => haptics, writes: () => writes };
}
function event(y) { return { nativeEvent: { pageX: 100, pageY: y, touches: [{ pageX: 100, pageY: y }] } }; }
test('text drops use horizontal hit coordinates, preserve photo size and runs, and invalidate cancelled lookups', async () => {
  const calls = [];
  const f = reorderFixture(async (...args) => { calls.push(args); return { offset: 2, top: 23 }; });
  f.start(); f.activate(); f.move(80);
  await new Promise(done => setImmediate(done));
  assert.equal(calls[0].join(), 'a,80,30');
  assert.equal(f.render().drag.drop.offset, 2);
  f.end(); await new Promise(done => setImmediate(done));
  assert.equal(f.current()[0].content, '앞 '); assert.equal(f.current()[1], blocks[1]); assert.equal(f.current()[2].content, '문단');
  assert.equal(f.writes(), 1);
  let resolve;
  const cancelled = reorderFixture(() => new Promise(done => { resolve = done; }));
  cancelled.start(); cancelled.activate(); cancelled.move(80); cancelled.end(); cancelled.blur(); resolve({ offset: 2, top: 23 });
  await new Promise(done => setImmediate(done));
  assert.equal(cancelled.current(), blocks); assert.equal(cancelled.writes(), 0);
});

test('repeated sentence splits keep unique IDs, every character, individual formatting and legacy width defaults', () => {
  const source = { id: 'text', type: 'text', content: '첫 문장.다음 문장.', runs: [{ text: '첫 문장.', fontFamily: 'serif', color: '#2467B5' }, { text: '다음 문장.', bold: true, backgroundColor: '#FFDF80' }] };
  const photo = { ...blocks[1], widthRatio: 0.55 };
  const next = editing.moveBlockIntoText([source, photo], photo.id, { id: source.id, offset: 5, top: 20 });
  assert.equal(next[0].content, '첫 문장.'); assert.equal(next[2].content, '다음 문장.'); assert.equal(next[0].runs[0].fontFamily, 'serif'); assert.equal(next[2].runs[0].bold, true); assert.equal(next[1], photo);
  const twice = editing.moveBlockIntoText(next, photo.id, { id: next[2].id, offset: 2, top: 20 });
  assert.equal(new Set(twice.map(b => b.id)).size, twice.length);
  assert.equal(twice.filter(b => b.type === 'text').map(b => b.content).join(''), source.content);
  assert.equal(JSON.parse(JSON.stringify(twice)).find(b => b.id === photo.id).widthRatio, 0.55);
  assert.equal(editing.imageWidthRatio(), 1); assert.equal(editing.imageWidthRatio(NaN), 1); assert.equal(editing.imageWidthRatio(0), 0.35); assert.equal(editing.imageWidthRatio(9), 1);
});
test('photo long press is single-flight, quick movement remains scroll, release commits once', () => {
  const quick = reorderFixture(); quick.start(); quick.move(215); quick.activate();
  assert.equal(quick.render().drag, null); assert.equal(quick.haptics(), 0);
  const f = reorderFixture(); f.start(); f.activate(); assert.equal(f.haptics(), 1); assert.equal(f.render().drag.id, 'photo');
  f.move(550); f.end(); f.end();
  assert.equal(f.writes(), 1); assert.equal(f.current().map(b => b.id).join(), 'a,h,d,b,photo');
  assert.equal(f.render().drag, null);
});
test('cancel, blur and Android back release reorder lock without mutating the document', () => {
  for (const end of ['cancel', 'blur', 'back']) {
    const f = reorderFixture(); f.start(); f.activate(); f.move(550); f[end]();
    assert.equal(f.current(), blocks); assert.equal(f.writes(), 0); assert.equal(f.render().drag, null);
  }
});
test('edge auto-scroll advances within content bounds without reordering until release', () => {
  const f = reorderFixture(); f.start(); f.activate(); f.move(649); f.tick(0); f.tick(16.67);
  assert.ok(f.render().metrics.current.offset > 0); assert.equal(f.current(), blocks);
  f.render().metrics.current.offset = 699; f.tick(33.34);
  assert.equal(f.render().metrics.current.offset, 700);
  f.cancel(); f.tick(50); assert.equal(f.current(), blocks);
});

test('normalized drag and pinch/rotation use image size and keep anchors visible', () => {
  const base = original.decorations[0];
  const one = decoration.transformDecoration(base, [{ x: 0, y: 0 }], [{ x: 39, y: -50 }], { width: 390, height: 500 });
  const two = decoration.transformDecoration(base, [{ x: 0, y: 0 }], [{ x: 78, y: -100 }], { width: 780, height: 1000 });
  assert.equal(one.x, two.x); assert.equal(one.y, two.y);
  const pinch = decoration.transformDecoration(base, [{ x: -10, y: 0 }, { x: 10, y: 0 }], [{ x: 0, y: -20 }, { x: 0, y: 20 }], { width: 390, height: 500 });
  assert.equal(pinch.scale, 2); assert.equal(pinch.rotation, 90);
  const far = decoration.transformDecoration(base, [{ x: 0, y: 0 }], [{ x: 9999, y: 9999 }], { width: 390, height: 500 });
  assert.ok(far.x + base.width / 2 < 1); assert.ok(far.y + base.height / 2 < 1);
});
test('legacy overlays clone without migration; edits, deletion and layer order undo/redo without original mutation', () => {
  let history = { past: [], present: decoration.cloneImage(original), future: [] };
  const next = decoration.patchDecoration(history.present, 'overlay', { text: '수정', rotation: 30, scale: 1.2 });
  history = decoration.commitDecoration(history, next);
  assert.equal(original.decorations[0].text, '기존 제목'); assert.equal(original.decorations[0].rotation, undefined);
  const changed = history.present;
  history = decoration.undoDecoration(history); assert.equal(history.present.decorations[0].rotation, undefined);
  history = decoration.redoDecoration(history); assert.equal(history.present, changed);
  history = decoration.commitDecoration(history, { ...changed, decorations: [] });
  history = decoration.undoDecoration(history); assert.equal(history.present.decorations.length, 1);
  history = decoration.commitDecoration(history, { ...changed, decorations: [...changed.decorations, { id: 'second', type: 'shape', x: 0, y: 0 }] });
  assert.equal(history.future.length, 0);
  history = decoration.commitDecoration(history, decoration.bringToFront(history.present, 'overlay'));
  assert.equal(decoration.orderedDecorations(history.present.decorations).at(-1).id, 'overlay');
  assert.equal(decoration.orderedDecorations(decoration.undoDecoration(history).present.decorations).at(-1).id, 'second');
  for (let i = 0; i < 65; i++) history = decoration.commitDecoration(history, decoration.patchDecoration(history.present, 'overlay', { rotation: i }));
  assert.equal(history.past.length, 40); assert.equal(history.present.uri, 'original-uri');
});
test('ordered blocks and formatting/transform metadata reach actual renderer and local save unchanged', () => {
  const typography = load('constants/typography.ts');
  const Renderer = load('components/PostBlockRenderer.tsx', {
    '@/constants/typography': typography, 'react-native': { Platform: { OS: 'web' }, StyleSheet: { create: x => x }, Text: 'Text', View: 'View' }, '@/constants/colors': { COLORS: {}, RADIUS: {} }, './DecoratedImage': { default: 'DecoratedImage', __esModule: true }, './PostExtraBlock': { default: 'PostExtraBlock', __esModule: true },
  }).default;
  const reordered = editing.moveBlockBefore([{ ...blocks[0], fontSize: 18, bold: true }, { ...blocks[1], decoratedImage: decoration.patchDecoration(original, 'overlay', { rotation: 45, scale: 1.5 }) }, { ...blocks[2], bold: false }], 'photo', null);
  const tree = Renderer({ blocks: reordered });
  const children = tree.props.children;
  assert.equal(children.map(child => child.key).join(), 'a,h,photo');
  assert.equal(children[0].props.style[1].fontWeight, '700'); assert.equal(children[1].props.style[1].fontWeight, '400');
  assert.equal(children[2].props.image.decorations[0].rotation, 45);
  const data = { allPosts: [], publicPosts: [], shopPosts: [], currentUser: { id: 'me' } };
  const service = load('services/postDraft.ts', { '@/data/mockData': data, '@/data/homeData': { magazineArticles: [] } });
  const saved = service.savePostDraft({ title: '저장', category: '질문', tagText: '', mode: 'public', blocks: reordered });
  assert.equal(saved.blocks, reordered); assert.equal(saved.decoratedImage.decorations[0].scale, 1.5);
});

function decoratorFixture() {
  const slots = []; let cursor = 0, writes = 0, backs = 0, saved, dirty;
  const react = { ...React, useRef: v => { const i = cursor++; return slots[i] ??= { current: v }; }, useState: v => { const i = cursor++; if (!(i in slots)) slots[i] = typeof v === 'function' ? v() : v; return [slots[i], n => { slots[i] = typeof n === 'function' ? n(slots[i]) : n; }]; }, useMemo: fn => { const i = cursor++; return slots[i] ??= fn(); }, useEffect() {} };
  const native = { StyleSheet: { create: x => x }, AppState: { addEventListener: () => ({ remove() {} }) } };
  for (const n of ['Pressable','ScrollView','Text','View']) native[n] = n;
  const Screen = load('app/image-decorator.tsx', {
    react, 'react-native': native, 'expo-router': { useLocalSearchParams: () => ({ draftKey: 'draft' }), useRouter: () => ({ back: () => backs++ }) }, 'expo-status-bar': { StatusBar: 'StatusBar' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' }, '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '@/components/DecoratedImage': { default: 'DecoratedImage', __esModule: true }, '@/components/WritingSheet': { default: 'WritingSheet', __esModule: true }, '@/components/WritingTextInput': { default: 'WritingTextInput', __esModule: true },
    '@/constants/colors': { COLORS: {} }, '@/constants/typography': load('constants/typography.ts'), '@/services/decorationEditing': decoration,
    '@/data/imageDecorationDrafts': { getImageDecorationDraft: () => original, setImageDecorationDraft: (_key, value) => { writes++; saved = value; } },
    '@/hooks/useUnsavedChanges': { useUnsavedChanges: value => { dirty = value; return () => {}; } },
  }).default;
  const render = () => { cursor = 0; return Screen(); };
  function find(node, check) { if (!node || typeof node !== 'object') return; if (check(node)) return node; for (const child of [node.props?.children].flat(10)) { const result = find(child, check); if (result) return result; } }
  find(render(), n => n.type === 'View' && n.props.onLayout).props.onLayout({ nativeEvent: { layout: { width: 375, height: 500 } } });
  return { render, canvas: () => find(render(), n => n.type === 'DecoratedImage').props, tool: label => find(render(), n => n.props?.label === label || n.props?.accessibilityLabel === label).props, state: () => ({ writes, saved, backs, dirty }) };
}
test('real decorator gesture previews commit once at release; cancel restores baseline; done writes only once', () => {
  const f = decoratorFixture();
  let canvas = f.canvas(); canvas.onGestureStart(); canvas.onChangeDecoration('overlay', { x: 0.2 }); canvas.onChangeDecoration('overlay', { x: 0.3 });
  assert.equal(f.state().writes, 0); assert.equal(f.tool('실행 취소').disabled, true);
  f.canvas().onGestureEnd(true); assert.equal(f.canvas().image.decorations[0].x, 0.08);
  canvas = f.canvas(); canvas.onGestureStart(); canvas.onChangeDecoration('overlay', { x: 0.4, rotation: 20 }); f.canvas().onGestureEnd(false);
  assert.equal(f.tool('실행 취소').disabled, false); f.tool('실행 취소').onPress();
  assert.equal(f.canvas().image.decorations[0].x, 0.08); assert.equal(f.tool('실행 취소').disabled, true);
  f.tool('다시 실행').onPress(); assert.equal(f.canvas().image.decorations[0].rotation, 20);
  f.tool('꾸미기 완료').onPress(); f.tool('꾸미기 완료').onPress();
  assert.equal(f.state().writes, 1); assert.equal(f.state().backs, 1); assert.equal(f.state().saved.decorations[0].x, 0.4);
  assert.equal(original.decorations[0].x, 0.08);
});
test('decorator cancel never writes to writer and shape add/duplicate/delete are undoable', () => {
  const f = decoratorFixture();
  f.tool('레이어').onPress(); f.tool('도형').onPress(); assert.equal(f.canvas().image.decorations.length, 2);
  f.tool('복제').onPress(); assert.equal(new Set(f.canvas().image.decorations.map(i => i.id)).size, 3);
  f.tool('삭제').onPress(); assert.equal(f.canvas().image.decorations.length, 2);
  f.tool('실행 취소').onPress(); assert.equal(f.canvas().image.decorations.length, 3);
  f.tool('꾸미기 취소').onPress(); assert.equal(f.state().writes, 0); assert.equal(f.state().dirty, true);
});

test('photo transform gesture commits once, cancels cleanly, and survives undo/redo and completion', () => {
  const f = decoratorFixture(); f.tool('사진 조정').onPress();
  let canvas = f.canvas(); assert.equal(canvas.photoMode, true);
  canvas.onGestureStart(); canvas.onChangePhoto({ x: 0.1, y: -0.2, scale: 1.8, rotation: 30 }); f.canvas().onGestureEnd(true);
  assert.equal(f.canvas().image.photoTransform, undefined);
  canvas = f.canvas(); canvas.onGestureStart(); canvas.onChangePhoto({ x: 0.1, y: 0.2, scale: 2, rotation: 45 }); f.canvas().onGestureEnd(false);
  f.tool('실행 취소').onPress(); assert.equal(f.canvas().image.photoTransform, undefined);
  f.tool('다시 실행').onPress(); assert.equal(f.canvas().image.photoTransform.rotation, 45);
  f.tool('꾸미기 완료').onPress(); assert.equal(f.state().saved.photoTransform.scale, 2); assert.equal(f.state().saved.uri, original.uri);
});

test('one drawing stroke is one undo action and sticker palette creates independently movable emoji', () => {
  const f = decoratorFixture(); f.tool('그리기').onPress(); assert.equal(f.canvas().drawing, true);
  f.canvas().onGestureStart(); f.canvas().onGestureEnd(false);
  f.canvas().onStroke([{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]);
  assert.equal(f.canvas().image.decorations.at(-1).type, 'drawing');
  f.tool('실행 취소').onPress(); assert.equal(f.canvas().image.decorations.length, 1);
  f.tool('다시 실행').onPress(); assert.equal(f.canvas().image.decorations.length, 2);
  f.tool('스티커').onPress(); f.tool('스티커 🌸').onPress();
  const emoji = f.canvas().image.decorations.at(-1); assert.equal(emoji.text, '🌸');
  f.canvas().onSelect(emoji.id); f.tool('삭제').onPress(); assert.equal(f.canvas().image.decorations.length, 2);
});
