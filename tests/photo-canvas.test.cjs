const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function load(path, mocks = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { module: mod, exports: mod.exports, require: name => mocks[name] ?? require(name) });
  return mod.exports;
}
const editing = load('services/decorationEditing.ts');
function fixture(options) {
  const slots = []; let index = 0, responder, background;
  const calls = [], strokes = [], photos = [];
  const react = { ...React, useRef: value => { const i = index++; return slots[i] ??= { current: value }; }, useState: value => { const i = index++; slots[i] ??= value; return [slots[i], next => { slots[i] = next; }]; }, useMemo: fn => { const i = index++; return slots[i] ??= fn(); }, useEffect: fn => { const i = index++; if (!slots[i]) slots[i] = fn() || true; } };
  const Component = load('components/PhotoCanvasGestures.tsx', { react, 'react-native-svg': { default: 'Svg', Path: 'Path', __esModule: true }, 'react-native': { View: 'View', StyleSheet: { absoluteFill: {} }, Dimensions: { get: () => ({ width: 390 }) }, PanResponder: { create: handlers => { responder = handlers; return { panHandlers: handlers }; } }, AppState: { addEventListener: (_event, fn) => { background = fn; return { remove() {} }; } } }, '@/services/decorationEditing': editing }).default;
  const render = () => { index = 0; return Component({ width: 100, height: 200, drawing: false, photoMode: false, color: '#fff', strokeWidth: 4, ...options, onSelect: () => calls.push('select'), onGestureStart: () => calls.push('start'), onGestureEnd: cancelled => calls.push(cancelled ? 'cancel' : 'end'), onStroke: points => strokes.push(points), onPhotoChange: transform => photos.push(transform) }); };
  render(); return { render, handlers: () => responder, background: state => background(state), calls, strokes, photos };
}
const event = (x, y, touches = [{ identifier: 1, pageX: x + 50, pageY: y + 50 }]) => ({ nativeEvent: { pageX: x + 50, locationX: x, locationY: y, touches } });
test('drawing gesture samples normalized points, commits once and renders width-scaled vector coordinates', () => {
  const f = fixture({ drawing: true }); const h = f.handlers();
  h.onPanResponderGrant(event(10, 20)); h.onPanResponderMove(event(50, 100)); h.onPanResponderMove(event(120, 250));
  assert.equal(f.strokes.length, 0); h.onPanResponderRelease(); h.onPanResponderRelease();
  assert.equal(f.strokes.length, 1); assert.equal(f.strokes[0][1].x, 0.5); assert.equal(f.strokes[0].at(-1).y, 1);
  assert.equal(editing.strokePath(f.strokes[0], { width: 200, height: 400 }), 'M20.00,40.00 L100.00,200.00 L200.00,400.00');
  assert.equal(f.calls.join(), 'start,end');
});
test('second touch, responder termination and app background discard unfinished drawing', () => {
  for (const reason of ['second', 'terminate', 'background']) {
    const f = fixture({ drawing: true }); const h = f.handlers(); h.onPanResponderGrant(event(10, 20));
    if (reason === 'second') h.onPanResponderMove(event(30, 40, [{ pageX: 80, pageY: 90 }, { pageX: 100, pageY: 100 }]));
    if (reason === 'terminate') h.onPanResponderTerminate();
    if (reason === 'background') f.background('background');
    h.onPanResponderRelease(); assert.equal(f.strokes.length, 0); assert.ok(f.calls.includes('cancel'));
  }
});
test('photo pinch/rotation rebases finger changes and clamps scale and movement', () => {
  const f = fixture({ photoMode: true }); const h = f.handlers();
  h.onPanResponderGrant(event(0, 0, [{ identifier: 1, pageX: 50, pageY: 50 }, { identifier: 2, pageX: 150, pageY: 50 }]));
  h.onPanResponderMove(event(0, 0, [{ identifier: 1, pageX: 100, pageY: -50 }, { identifier: 2, pageX: 100, pageY: 150 }]));
  assert.equal(f.photos.at(-1).scale, 2); assert.equal(f.photos.at(-1).rotation, 90);
  h.onPanResponderMove(event(0, 0, [{ identifier: 1, pageX: 100, pageY: 50 }])); const before = f.photos.length;
  h.onPanResponderMove(event(0, 0, [{ identifier: 1, pageX: 110, pageY: 70 }]));
  assert.equal(f.photos.length, before + 1); assert.equal(f.photos.at(-1).scale, 2); assert.equal(f.photos.at(-1).x, 0.1);
  h.onPanResponderRelease(); assert.equal(f.calls.join(), 'start,end');
  const bounded = editing.transformPhoto({ x: 0, y: 0, scale: 4, rotation: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 0 }], [{ x: 9999, y: 9999 }, { x: 99999, y: 99999 }], { width: 100, height: 100 });
  assert.equal(bounded.x, 1); assert.equal(bounded.y, 1); assert.equal(bounded.scale, 4);
});
test('drawing points and photo transform are independently cloned for re-editing and history', () => {
  const original = { uri: 'original', photoTransform: { x: 0, y: 0, rotation: 15, scale: 2 }, decorations: [{ id: 'd', type: 'drawing', points: [{ x: 0.1, y: 0.2 }] }] };
  const clone = editing.cloneImage(original); clone.photoTransform.rotation = 90; clone.decorations[0].points[0].x = 0.9;
  assert.equal(original.photoTransform.rotation, 15); assert.equal(original.decorations[0].points[0].x, 0.1);
});
