const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const moduleContext = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('constants/typography.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: moduleContext.exports });
const { TYPOGRAPHY, authoredTextStyle } = moduleContext.exports;

test('UI scale matches the agreed typography contract with readable line heights', () => {
  const expected = { display: [28, 36], titleLarge: [24, 32], titleMedium: [20, 28], titleSmall: [18, 24], bodyLarge: [16, 24], bodyMedium: [15, 22], bodySmall: [14, 20], labelLarge: [14, 20], labelMedium: [13, 18], caption: [12, 16] };
  assert.deepEqual(Object.keys(TYPOGRAPHY), Object.keys(expected));
  for (const [name, [size, height]] of Object.entries(expected)) {
    assert.equal(TYPOGRAPHY[name].fontSize, size);
    assert.equal(TYPOGRAPHY[name].lineHeight, height);
    assert.ok(['400', '600', '700'].includes(TYPOGRAPHY[name].fontWeight));
  }
});

test('every audited UI style uses its semantic token; only documented graphics keep literal sizes', () => {
  const audit = JSON.parse(fs.readFileSync('docs/typography-style-audit.json', 'utf8'));
  const files = [...new Set(audit.map((entry) => entry.path))];
  for (const file of files) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function walk(node) {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'StyleSheet.create') {
        for (const style of node.arguments[0].properties) {
          if (!ts.isPropertyAssignment(style) || !ts.isObjectLiteralExpression(style.initializer)) continue;
          const name = style.name.getText(source);
          const entry = audit.find((item) => item.path === file && item.name === name);
          const literalSize = style.initializer.properties.some((prop) => ts.isPropertyAssignment(prop) && ['fontSize', 'lineHeight'].includes(prop.name.getText(source)));
          if (literalSize) assert.ok(entry?.exception, `${file}:${name} has undocumented literal metrics`);
          if (entry?.token === 'weight-only') {
            assert.ok(style.initializer.properties.some((prop) => ts.isPropertyAssignment(prop) && prop.name.getText(source) === 'fontWeight' && prop.initializer.getText(source).startsWith('FONT_WEIGHT.')), `${file}:${name} lost its shared weight`);
          } else if (entry?.token) {
            assert.ok(style.initializer.properties.some((prop) => ts.isSpreadAssignment(prop) && prop.expression.getText(source) === `TYPOGRAPHY.${entry.token}`), `${file}:${name} lost its token`);
          }
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(source);
    assert.ok(!source.text.includes('allowFontScaling={false}'), `${file} disables scaling`);
  }
});

test('authored article sizes remain readable and get proportional line heights', () => {
  assert.equal(authoredTextStyle(10).fontSize, 12);
  assert.equal(authoredTextStyle(24).lineHeight, 36);
  assert.equal(authoredTextStyle(18, true).fontWeight, '700');
  assert.equal(authoredTextStyle(undefined).fontSize, 15);
  assert.equal(authoredTextStyle(undefined, false, true).fontSize, 20);
});
