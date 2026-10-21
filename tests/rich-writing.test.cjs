const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleFixture = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('services/richWriting.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: moduleFixture, exports: moduleFixture.exports });
const { continuousBlocks, textRuns, textHTML, textLines, richDocument } = moduleFixture.exports;
test('legacy adjacent text merges preserving sizes/bold; image order and identity are unchanged', () => {
  const photo = { id: 'photo', type: 'image', imageUrl: 'local' };
  const blocks = continuousBlocks([{ id: 'a', type: 'text', content: '첫줄', fontSize: 18, bold: true }, { id: 'b', type: 'text', content: '다음줄', fontSize: 14, bold: false }, photo]);
  assert.equal(blocks.length, 2); assert.equal(blocks[1], photo);
  assert.equal(blocks[0].content, '첫줄\n다음줄');
  assert.equal(textRuns(blocks[0])[0].fontSize, 18); assert.equal(textRuns(blocks[0])[2].bold, false);
});
test('mixed runs survive JSON save/reload; per-line alignment and trailing Enter survive HTML restoration', () => {
  const block = JSON.parse(JSON.stringify({ id: 'a', type: 'text', content: '기본 굵게\n오른쪽\n', runs: [{ text: '기본 ', fontSize: 15, bold: false, align: 'left' }, { text: '굵게\n', fontSize: 18, bold: true, align: 'left' }, { text: '오른쪽\n', fontSize: 14, bold: false, align: 'right' }] }));
  const lines = textLines(block);
  assert.equal(lines.length, 3); assert.equal(lines[1].align, 'right');
  assert.equal(lines[0].runs[1].bold, true); assert.equal(lines[0].runs[1].fontSize, 18);
  assert.match(textHTML(block), /text-align:right/); assert.match(textHTML(block), /<br><\/div>$/);
});
test('authored text is escaped and stale runs cannot replace edited plain content', () => {
  const block = { id: 'a', type: 'text', content: '<script>bad()</script> & "글"', runs: [{ text: 'old' }] };
  assert.equal(textRuns(block)[0].text, block.content);
  assert.ok(!textHTML(block).includes('<script>')); assert.match(textHTML(block), /&lt;script&gt;/);
  const document = richDocument(block);
  const script = document.split('<script>')[1].split('</script>')[0];
  assert.doesNotThrow(() => new vm.Script(script));
});

test('all new author styles survive JSON and restore to real markup independently', () => {
  const run = { text: '선택 서식', fontSize: 24, bold: true, italic: true, underline: true, fontFamily: 'monospace', color: '#DC4869', backgroundColor: '#FFDF80' };
  const block = JSON.parse(JSON.stringify({ id: 'styled', type: 'text', content: run.text, runs: [run] }));
  const html = textHTML(block);
  for (const value of ['font-size:24px', 'font-weight:700', 'font-style:italic', 'text-decoration:underline', 'font-family:monospace', 'color:#DC4869', 'background-color:#FFDF80']) assert.ok(html.includes(value), value);
});
