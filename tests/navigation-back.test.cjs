const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function guardFixture(platform = 'ios') {
  const calls = [];
  let prompt, blocked, listener;
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('hooks/useUnsavedChanges.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    window: { confirm: () => false },
    require(name) {
      return {
        react: { useRef: (current) => ({ current }), useCallback: (fn) => fn },
        'expo-router/react-navigation': {
          useNavigation: () => ({ dispatch: (action) => calls.push(action) }),
          usePreventRemove: (dirty, callback) => { blocked = dirty; listener = callback; },
        },
        'react-native': {
          Platform: { OS: platform },
          Alert: { alert: (...args) => { prompt = args; calls.push('prompt'); } },
        },
      }[name];
    },
  });
  return {
    use: module.exports.useUnsavedChanges,
    remove: (action) => { if (blocked) listener({ data: { action } }); else calls.push(action); },
    calls, prompt: () => prompt,
  };
}

test('clean drafts allow back; dirty drafts cancel without dispatching and suppress duplicate prompts', () => {
  const f = guardFixture();
  const action = { type: 'GO_BACK' };
  f.use(false); f.remove(action);
  assert.equal(f.calls[0], action);
  f.use(true); f.remove(action); f.remove(action);
  assert.equal(f.calls.filter((call) => call === 'prompt').length, 1);
  f.prompt()[2][0].onPress();
  assert.equal(f.calls.length, 2);
  f.remove(action);
  assert.equal(f.calls.length, 3);
});

test('discard replays the original action, including source, target and destination', () => {
  const f = guardFixture('android');
  f.use(true);
  const action = { type: 'POP', source: 'editor', target: 'stack', payload: { count: 1 } };
  f.remove(action);
  f.prompt()[2][1].onPress();
  assert.equal(f.calls[1], action);
});

test('successful save bypasses discard confirmation for the next removal only', () => {
  const f = guardFixture();
  const saved = f.use(true);
  const replace = { type: 'REPLACE', payload: { name: 'post/[id]' } };
  saved(); f.remove(replace);
  assert.deepEqual(f.calls, [replace]);
  f.remove({ type: 'GO_BACK' });
  assert.equal(f.calls[1], 'prompt');
});

test('search horizontal responder yields native edges and vertical movement', () => {
  const source = fs.readFileSync('app/search.tsx', 'utf8');
  const ast = ts.createSourceFile('search.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let predicate;
  function visit(node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === 'onMoveShouldSetPanResponderCapture') {
      predicate = node.initializer.getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const shouldCapture = vm.runInNewContext(`(${predicate})`, { Platform: { OS: 'ios' }, width: 390 });
  assert.equal(shouldCapture(null, { x0: 10, dx: 80, dy: 0 }), false);
  assert.equal(shouldCapture(null, { x0: 380, dx: -80, dy: 0 }), false);
  assert.equal(shouldCapture(null, { x0: 180, dx: 80, dy: 3 }), true);
  assert.equal(shouldCapture(null, { x0: 180, dx: 5, dy: 80 }), false);
});

test('gallery back listener is removed on blur and only consumes back for an open viewer', () => {
  const source = fs.readFileSync('app/design-gallery.tsx', 'utf8');
  const ast = ts.createSourceFile('gallery.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let effect;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useFocusEffect') {
      effect = node.arguments[0].getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const selectedPhoto of [null, 0]) {
    let listener, closed = false;
    const setup = vm.runInNewContext(effect, {
      useCallback: (callback) => callback,
      selectedPhoto,
      setSelectedPhoto: (value) => { closed = value === null; },
      BackHandler: { addEventListener: (_, callback) => {
        listener = callback;
        return { remove: () => { listener = undefined; } };
      } },
    });
    const blur = setup();
    assert.equal(listener(), selectedPhoto !== null);
    assert.equal(closed, selectedPhoto !== null);
    blur();
    assert.equal(listener, undefined);
  }
});
