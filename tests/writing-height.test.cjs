const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const flatten = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
function inputFixture(scale = 1, element = null) {
  let state, stateChanges = 0;
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/WritingTextInput.tsx','utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports: module.exports, module,
    require(name) {
      if (name === 'react') return { ...React, useRef: () => ({ current: element }), useState: initial => { if (state === undefined) state = initial; return [state, next => { const value = typeof next === 'function' ? next(state) : next; if (value !== state) stateChanges++; state = value; }]; }, useLayoutEffect: fn => { if (element) fn(); }, useImperativeHandle: () => {}, useCallback: fn => fn };
      if (name === 'react-native') return { Platform: { OS: element ? 'web' : 'android' }, TextInput: 'TextInput', StyleSheet: { flatten }, useWindowDimensions: () => ({ width: 320, fontScale: scale }) };
      if (name === '@/constants/typography') return { TYPOGRAPHY: { bodyMedium: { lineHeight: 22 } } };
      return require(name);
    },
  });
  return { render: props => module.exports.default.render(props, null), changes: () => stateChanges };
}
const body = { minimumLines: 3, value: '', style: { lineHeight: 22, padding: 0 } };
const measure = (node, height) => node.props.onContentSizeChange({ nativeEvent: { contentSize: { height } } });
const height = node => flatten(node.props.style).height;

test('native title/body/tag have independent minima and content measurements', () => {
  const title = inputFixture(), text = inputFixture(), tag = inputFixture();
  const titleProps = { value: '제목', style: { lineHeight: 28, paddingVertical: 6, borderBottomWidth: 1 } };
  const tagProps = { value: '', style: { lineHeight: 22, paddingVertical: 6 } };
  assert.equal(height(title.render(titleProps)), 41);
  assert.equal(height(text.render(body)), 66);
  assert.equal(height(tag.render(tagProps)), 34);
  measure(text.render({ ...body, value: '긴 본문' }), 264);
  assert.equal(height(text.render({ ...body, value: '긴 본문' })), 264);
  assert.equal(height(title.render(titleProps)), 41);
  assert.equal(height(tag.render(tagProps)), 34);
  assert.equal(height(text.render(body)), 66);
});

test('native content shrinks to its floor and repeated or 1px noisy measurements do not accumulate padding', () => {
  const f = inputFixture(); const props = { value: '태그', style: { lineHeight: 22, paddingVertical: 6 } };
  measure(f.render(props), 100);
  assert.equal(height(f.render(props)), 100);
  const changes = f.changes();
  for (let i=0; i<100; i++) measure(f.render(props), i % 2 ? 100 : 100.4);
  assert.equal(f.changes(), changes);
  assert.equal(height(f.render(props)), 100);
  measure(f.render(props), 34);
  assert.equal(height(f.render(props)), 34);
  assert.equal(f.render(props).props.scrollEnabled, false);
});

test('minimum lines follow text scaling and heading/body roles', () => {
  const f = inputFixture(1.5);
  assert.equal(height(f.render(body)), 99);
  assert.equal(height(f.render({ value: '', style: { lineHeight: 28 }, minimumLines: 1 })), 42);
  assert.equal(height(f.render({ ...body, maxFontSizeMultiplier: 1.2 })), 80);
});

test('web measurement holds the displayed width while the document scrollbar disappears and also shrinks', () => {
  let long = true;
  const element = {
    style: { width: '', minHeight: '66px', height: '300px' },
    getBoundingClientRect: () => ({ width: 320 }),
    get scrollHeight() { return long ? (this.style.width === '320px' ? 96 : 72) : 22; },
  };
  const f = inputFixture(1, element);
  for (let i=0; i<5; i++) f.render({ ...body, value: '긴 본문' });
  assert.equal(element.style.height, '96px');
  assert.equal(element.style.width, '');
  long = false; f.render(body);
  assert.equal(element.style.height, '66px');
  assert.equal(element.style.minHeight, '66px');
});
