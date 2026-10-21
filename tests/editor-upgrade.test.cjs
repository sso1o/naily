const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function load(path, mocks = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    module, exports: module.exports, require: name => name in mocks ? mocks[name] : name === './postBlocks' ? load('services/postBlocks.ts') : name === './richWriting' || name === '@/services/richWriting' ? load('services/richWriting.ts') : require(name),
  });
  return module.exports;
}
const editing = load('services/documentEditing.ts');
const colors = load('services/colorPicking.ts');
test('photo sampling reads RGBA bytes and bounds the selected pixel; spectrum and CSS colors normalize independently', () => {
  const photo = { width: 2, height: 2, data: Uint8Array.from([255,0,0,255,0,255,0,255,0,0,255,255,128,64,32,255]) };
  assert.equal(colors.pixelColor(photo, 0, 0), '#FF0000');
  assert.equal(colors.pixelColor(photo, 1, 0), '#00FF00');
  assert.equal(colors.pixelColor(photo, -1, 9), '#0000FF');
  assert.equal(colors.pixelColor(photo, 1, 1), '#804020');
  assert.equal(colors.hsvColor(240, 1, 1), '#0000FF'); assert.equal(colors.hsvColor(0, 0, 0.5), '#808080');
  assert.equal(colors.normalizeColor('rgb(36, 103, 181)'), '#2467B5'); assert.equal(colors.normalizeColor('rgba(0, 0, 0, 0)'), 'transparent');
});
function resizeFixture() {
  const slots = [], responders = []; let cursor = 0, writes = [], background;
  const react = { ...React, useRef: v => { const i = cursor++; return slots[i] ??= { current: v }; }, useState: v => { const i = cursor++; if (!(i in slots)) slots[i] = v; return [slots[i], n => { slots[i] = n; }]; }, useMemo: fn => { const i = cursor++; return slots[i] ??= fn(); }, useEffect: fn => fn() };
  const Resize = load('components/ResizablePostImage.tsx', {
    react, 'react-native': { PanResponder: { create: config => { responders.push(config); return { panHandlers: config }; } }, AppState: { addEventListener: (_event, fn) => { background = fn; return { remove() {} }; } }, StyleSheet: { create: x => x }, View: 'View', Text: 'Text', Pressable: 'Pressable' },
    '@expo/vector-icons': { Ionicons: 'Ionicons' }, './DecoratedImage': { default: 'DecoratedImage', __esModule: true }, '@/constants/colors': { COLORS: {} }, '@/constants/typography': load('constants/typography.ts'), '@/services/documentEditing': editing,
  }).default;
  const block = { id: 'photo', type: 'image', imageUrl: 'original', widthRatio: 0.55 };
  const render = () => { cursor = 0; return Resize({ block, selected: true, dragProps: {}, onSelect() {}, onChange: value => writes.push(value) }); };
  const tree = render(); tree.props.onLayout({ nativeEvent: { layout: { width: 300 } } });
  return { render, pinch: responders[0], handle: responders[1], writes: () => writes, background: () => background('background') };
}
const touches = distance => ({ nativeEvent: { touches: [{ pageX: 0, pageY: 0 }, { pageX: distance, pageY: 0 }] } });
test('pinch and width handle preview without writes, commit once on release, clamp and discard interrupted gestures', () => {
  const f = resizeFixture();
  f.pinch.onPanResponderGrant(touches(100)); f.pinch.onPanResponderMove(touches(200)); assert.equal(f.writes().length, 0);
  f.pinch.onPanResponderRelease(); f.pinch.onPanResponderRelease(); assert.equal(f.writes().join(), '1');
  f.handle.onPanResponderGrant(); f.handle.onPanResponderMove({}, { dx: -999 }); f.handle.onPanResponderRelease(); assert.equal(f.writes().join(), '1,0.35');
  f.pinch.onPanResponderGrant(touches(100)); f.pinch.onPanResponderMove(touches(120)); f.pinch.onPanResponderTerminate(); assert.equal(f.writes().length, 2);
  f.handle.onPanResponderGrant(); f.handle.onPanResponderMove({}, { dx: 15 }); f.background(); f.handle.onPanResponderRelease(); assert.equal(f.writes().length, 2);
});
test('stored legacy serif family restores a real Korean font, and embedded bridge remains valid JavaScript', () => {
  const rich = load('services/richWriting.ts');
  const block = { id: 'text', type: 'text', content: '한글 명조', runs: [{ text: '한글 명조', fontFamily: 'serif', color: '#2467B5', backgroundColor: '#FFDF80' }] };
  const html = rich.richDocument(JSON.parse(JSON.stringify(block)));
  assert.ok(html.includes('font-family:NailySerif,serif')); assert.ok(html.includes('document.caretPositionFromPoint')); assert.ok(html.includes("data.kind==='fonts'"));
  new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);
});
test('actual embedded background algorithm clears only the selected range, preserves all other styles and supports future typing', () => {
  const rich = load('services/richWriting.ts');
  const script = rich.richDocument({ id: 't', type: 'text', content: '' }).match(/<script>([\s\S]*)<\/script>/)[1];
  const ast = ts.createSourceFile('editor.js', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'recolorBackground');
  const recolor = vm.runInNewContext(`${fn.getText(ast)};recolorBackground`);
  const runs = [{ text: '앞 문장\n', bold: true, fontFamily: 'serif', color: '#2467B5', backgroundColor: '#FFDF80' }, { text: '뒤 문장', italic: true, underline: true, backgroundColor: '#DFA6B6' }];
  const next = recolor(runs, {}, 2, 7, 'transparent');
  assert.equal(next.map(run => run.text).join(''), runs.map(run => run.text).join(''));
  assert.equal(next[0].backgroundColor, '#FFDF80'); assert.equal(next.at(-1).backgroundColor, '#DFA6B6');
  assert.equal(next[1].backgroundColor, 'transparent'); assert.equal(next[1].fontFamily, 'serif'); assert.equal(next[1].color, '#2467B5'); assert.equal(next[1].bold, true);
  assert.equal(next[2].underline, true); assert.equal(runs[0].backgroundColor, '#FFDF80');
  const typing = recolor(runs, { fontFamily: 'serif', color: '#2467B5', bold: true }, 3, 3, 'transparent');
  assert.equal(typing.filter(run => !run.typing).map(run => run.text).join(''), runs.map(run => run.text).join(''));
  assert.equal(typing.filter(run => run.typing).length, 1); assert.equal(typing.find(run => run.typing).fontFamily, 'serif'); assert.equal(typing.find(run => run.typing).backgroundColor, 'transparent');
});
