const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
function load(path, mocks, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, {
    module, exports: module.exports, require: (name) => name in mocks ? mocks[name] : /(?:ColorPicker|PrimaryButton|ResizablePostImage)$/.test(name) ? { default: name.split('/').at(-1), __esModule: true } : name === '@/data/mockData' ? {commitData:()=>{}} : name === 'expo-font' ? { isLoaded: () => true } : name === '@/services/colorPicking' ? load('services/colorPicking.ts', {}) : name === '@/services/documentEditing' ? load('services/documentEditing.ts', {}) : name === '@/services/richWriting' || name === './richWriting' ? load('services/richWriting.ts', {}) : (name === '@/services/postBlocks' || name === './postBlocks') ? load('services/postBlocks.ts', {}) : name === './postBlocks' ? load('services/postBlocks.ts', {}) : require(name), ...globals,
  });
  return module.exports;
}
function dataFixture() {
  const data = { allPosts: [], publicPosts: [], shopPosts: [], currentUser: { id: 'me', nickname: '작성자', role: 'general' } };
  const magazineArticles = [];
  const service = load('services/postDraft.ts', { '@/data/mockData': data, '@/data/homeData': { magazineArticles } });
  return { ...data, magazineArticles, ...service };
}
const draft = { title: ' 제목 ', category: '후기', tagText: '#시럽  #여름\n #', blocks: [{ id: 't', type: 'text', content: '본문' }], mode: 'public' };

test('new drafts are empty; edit clones do not mutate the original decorations', () => {
  const f = dataFixture();
  assert.equal(f.initialPostBlocks()[0].content, '');
  const original = { blocks: [{ id: 'i', type: 'image', decoratedImage: { uri: 'local', decorations: [{ text: '원본' }] } }] };
  const copy = f.initialPostBlocks(original);
  copy[0].decoratedImage.decorations[0].text = '수정';
  assert.equal(original.blocks[0].decoratedImage.decorations[0].text, '원본');
});

test('public save keeps the existing block schema and tag grammar, and rejects blank titles without writing', () => {
  const f = dataFixture();
  assert.throws(() => f.savePostDraft({ ...draft, title: '  ' }));
  assert.equal(f.allPosts.length, 0);
  const post = f.savePostDraft(draft);
  assert.equal(post.title, '제목');
  assert.equal(post.blocks, draft.blocks);
  assert.equal(post.tags.join(','), '시럽,여름');
  assert.equal(f.allPosts[0], f.publicPosts[0]);
  assert.equal(f.shopPosts.length, 0);
  assert.equal(f.parsePostTags('#a #a ##b').join(','), 'a,a,#b');
});

test('editing a shop post preserves audience, author and reactions even without a shop URL parameter', () => {
  const f = dataFixture();
  const existing = { ...f.savePostDraft({ ...draft, mode: 'shop' }), likeCount: 17, commentCount: 4 };
  f.allPosts[0] = existing; f.shopPosts[0] = existing;
  const saved = f.savePostDraft({ ...draft, title: '수정', existing, mode: 'public' });
  assert.equal(saved.isShopOnly, true);
  assert.equal(saved.authorId, existing.authorId);
  assert.equal(saved.likeCount, 17);
  assert.equal(saved.commentCount, 4);
  assert.equal(saved.createdAt, existing.createdAt);
  assert.equal(f.allPosts.length, 1);
  assert.equal(f.shopPosts[0], saved);
  assert.equal(f.publicPosts.length, 0);
});

test('magazine edits update their linked article instead of creating duplicates', () => {
  const f = dataFixture();
  const blocks = [...draft.blocks, { id: 'i', type: 'image', imageUrl: 'local', decoratedImage: { uri: 'local', decorations: [] } }];
  const existing = f.savePostDraft({ ...draft, blocks, mode: 'magazine' });
  f.savePostDraft({ ...draft, blocks, title: '수정', existing, mode: 'magazine' });
  assert.equal(f.magazineArticles.length, 1);
  assert.equal(f.magazineArticles[0].title, '수정');
  assert.equal(f.allPosts[0].imageUrl, 'local');
});

test('save, edit reload and second save retain selected text styles and line alignment without mutating the saved runs', () => {
  const f = dataFixture();
  const runs = [{ text: '기본 ', fontSize: 15, bold: false, align: 'left' }, { text: '강조\n', fontSize: 18, bold: true, align: 'left' }, { text: '오른쪽', fontSize: 16, bold: false, align: 'right' }];
  const saved = f.savePostDraft({ ...draft, blocks: [{ id: 'rich', type: 'text', content: '기본 강조\n오른쪽', runs }] });
  const reopened = f.initialPostBlocks(saved);
  assert.equal(JSON.stringify(reopened[0].runs), JSON.stringify(runs));
  reopened[0].runs[1].fontSize = 24;
  assert.equal(saved.blocks[0].runs[1].fontSize, 18);
  const edited = f.savePostDraft({ ...draft, blocks: reopened, existing: saved });
  assert.equal(edited.blocks[0].runs[1].fontSize, 24);
  assert.equal(edited.blocks[0].runs[2].align, 'right');
});

function hooks() {
  const slots = []; let cursor = 0; let focus;
  const useRef = (value) => { const i = cursor++; return slots[i] ??= { current: value }; };
  return { react: { ...React, useRef, useCallback: (fn) => fn, useState: (value) => { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], (next) => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; } }, render: (fn) => { cursor = 0; return fn(); }, setFocus: (fn) => { focus = fn; }, focus: () => focus() };
}
function find(node, match) {
  if (!node || typeof node !== 'object') return;
  if (match(node)) return node;
  for (const child of [node.props?.children, node.props?.header, node.props?.footer].flat(10)) {
    const result = find(child, match); if (result) return result;
  }
}
function screenFixture() {
  const h = hooks(), f = dataFixture(), calls = [], frames = [], decoration = new Map(); let dirty;
  const native = { Platform: { OS: 'web' }, StyleSheet: { create: x => x }, Keyboard: { dismiss() {} }, Alert: { alert: (...args) => calls.push(['alert', ...args]) } };
  for (const n of ['ActivityIndicator','KeyboardAvoidingView','Modal','Pressable','ScrollView','Text','TextInput','View']) native[n] = n;
  const typography = load('constants/typography.ts', {});
  const { default: Screen } = load('app/write.tsx', {
    react: h.react, 'react-native': native,
    'expo-router': { useLocalSearchParams: () => ({}), useRouter: () => ({ back() {}, replace: (url) => calls.push(url), push: (url) => calls.push(url) }), useFocusEffect: h.setFocus },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' }, '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '@/components/BlogEditor': { default: 'BlogEditor', __esModule: true }, '@/components/PostBlockRenderer': { default: 'PostBlockRenderer', __esModule: true }, '@/components/WritingSheet': { default: 'WritingSheet', __esModule: true }, '@/components/WritingTextInput': { default: 'WritingTextInput', __esModule: true },
    '@/constants/colors': { COLORS: {} }, '@/constants/typography': typography, '@/data/mockData': f,
    '@/data/imageDecorationDrafts': { takeImageDecorationDraft: key => { const value = decoration.get(key); decoration.delete(key); return value; }, setImageDecorationDraft: (key, value) => decoration.set(key, value) },
    '@/hooks/useUnsavedChanges': { useUnsavedChanges: (value) => { dirty = value; return () => calls.push('allow'); } },
    '@/services/postDraft': f,
  }, { requestAnimationFrame: fn => frames.push(fn) });
  return { ...f, render: () => h.render(Screen), find, calls, frames, dirty: () => dirty, focus: h.focus, decoration };
}

test('submit is disabled for empty title, protects dirty state, and saves once under rapid repeated presses', async () => {
  const f = screenFixture(); let tree = f.render();
  assert.equal(f.dirty(), false);
  assert.equal(find(tree, n => n.props?.accessibilityLabel === '등록').props.disabled, true);
  find(tree, n => n.props?.accessibilityLabel === '글 제목').props.onChangeText('테스트');
  tree = f.render(); assert.equal(f.dirty(), true);
  const submit = find(tree, n => n.props?.accessibilityLabel === '등록').props.onPress;
  const first = submit(); await submit(); await submit();
  assert.equal(f.frames.length, 1);
  assert.equal(find(f.render(), n => n.props?.accessibilityLabel === '등록').props.disabled, true);
  f.frames.shift()(); await first; await submit();
  assert.equal(f.allPosts.length, 1);
  assert.equal(f.calls[0], 'allow');
  assert.match(f.calls[1], /^\/post\//);
});

test('decoration return retains title, text and tags and consumes the result only once', () => {
  const f = screenFixture(); let tree = f.render();
  find(tree, n => n.props?.accessibilityLabel === '글 제목').props.onChangeText('보존할 제목');
  let editor = find(tree, n => n.type === 'BlogEditor');
  find(editor.props.footer, n => n.props?.accessibilityLabel === '태그 입력').props.onChangeText('#보존');
  editor.props.onChange([{ id: 't', type: 'text', content: '보존할 본문' }, { id: 'i', type: 'image', imageUrl: 'old', decoratedImage: { uri: 'old', decorations: [] } }]);
  tree = f.render(); editor = find(tree, n => n.type === 'BlogEditor');
  editor.props.onEditImage(editor.props.blocks[1]);
  f.decoration.set('write-i', { uri: 'decorated', decorations: [{ text: '장식' }] });
  f.focus(); tree = f.render(); editor = find(tree, n => n.type === 'BlogEditor');
  assert.equal(find(tree, n => n.props?.accessibilityLabel === '글 제목').props.value, '보존할 제목');
  assert.equal(editor.props.blocks[0].content, '보존할 본문');
  assert.equal(find(editor.props.footer, n => n.props?.accessibilityLabel === '태그 입력').props.value, '#보존');
  assert.equal(editor.props.blocks[1].imageUrl, 'decorated');
  editor.props.onChange(current => current.map(b => b.id === 'i' ? { ...b, imageUrl: 'replacement' } : b));
  f.render(); f.focus();
  assert.equal(find(f.render(), n => n.type === 'BlogEditor').props.blocks[1].imageUrl, 'replacement');
});

function editorFixture(picker) {
  const h = hooks(); let blocks = [{ id: 't', type: 'text', content: '처음' }]; let cleanup; const edits = [];
  h.react.useEffect = (fn) => { cleanup = fn(); };
  h.react.useImperativeHandle = () => {};
  const native = { StyleSheet: { create: x => x }, Platform: { OS: 'web' }, Keyboard: { dismiss() {}, isVisible: () => false }, Alert: { alert() {} } };
  for (const name of ['Pressable','ScrollView','Text','TextInput','View']) native[name] = name;
  const Editor = load('components/BlogEditor.tsx', {
    '@/hooks/usePhotoReorder': { usePhotoReorder: () => ({ scroll: { current: null }, viewport: { current: null }, metrics: { current: {} }, layouts: { current: new Map() }, handleProps: () => ({}) }) },
    react: h.react, 'expo-image-picker': picker, '@expo/vector-icons': { Ionicons: 'Ionicons' }, 'react-native': native,
    '@/constants/typography': load('constants/typography.ts', {}), '@/constants/colors': { COLORS: {} },
    './DecoratedImage': { default: 'DecoratedImage', __esModule: true }, './EditorToolbar': { default: 'EditorToolbar', __esModule: true },
    './WritingSheet': { default: 'WritingSheet', __esModule: true }, './RichWritingInput': { default: 'RichWritingInput', __esModule: true },
    './PostExtraBlock': { default: 'PostExtraBlock', __esModule: true }, './PostBlockForm': { default: 'PostBlockForm', __esModule: true },
  }, { requestAnimationFrame: fn => fn() }).default;
  const onChange = (next) => { blocks = typeof next === 'function' ? next(blocks) : next; };
  return { render: () => h.render(() => Editor.render({ blocks, onChange, onEditImage: (...args) => edits.push(args) }, null)), edits, blocks: () => blocks, onChange, unmount: () => cleanup?.() };
}

test('photo picker is single-flight and opens editing without inserting an unfinished photo or overwriting text', async () => {
  let resolve, launches = 0;
  const f = editorFixture({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: () => { launches++; return new Promise(done => { resolve = done; }); } });
  const photo = find(f.render(), n => n.type === 'EditorToolbar').props.onPhoto;
  const pending = photo(); await Promise.resolve(); await photo();
  f.onChange(current => current.map(b => ({ ...b, content: '선택 중 이어 쓴 본문' })));
  resolve({ canceled: false, assets: [{ uri: 'local-photo', width: 400, height: 500 }] });
  await pending;
  assert.equal(launches, 1);
  assert.equal(f.blocks()[0].content, '선택 중 이어 쓴 본문');
  assert.equal(f.blocks().length, 1);
  assert.equal(f.edits.length, 1); assert.equal(f.edits[0][1], true);
  assert.equal(f.edits[0][0].decoratedImage.aspectRatio, 0.8);
  assert.equal(f.edits[0][0].imageUrl, 'local-photo');
});

test('cancelled photos and late picker results after unmount leave the document untouched', async () => {
  const cancelled = editorFixture({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: true }) });
  await find(cancelled.render(), n => n.type === 'EditorToolbar').props.onPhoto();
  assert.equal(cancelled.blocks().length, 1);
  let resolve;
  const late = editorFixture({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: () => new Promise(done => { resolve = done; }) });
  const pending = find(late.render(), n => n.type === 'EditorToolbar').props.onPhoto(); await new Promise(done => setImmediate(done)); late.unmount();
  resolve({ canceled: false, assets: [{ uri: 'late' }] }); await pending;
  assert.equal(late.blocks().length, 1);
});

test('toolbar sends range commands to the focused rich editor and persists returned text runs', () => {
  const f = editorFixture({});
  f.onChange([{ id: 't', type: 'text', content: '한글 작성 중' }, { id: 'h', type: 'heading', content: '제목' }]);
  let tree = f.render();
  const toolbar = () => find(f.render(), n => n.type === 'EditorToolbar').props;
  const input = find(tree, n => n.type === 'RichWritingInput');
  const commands = []; input.props.ref({ focus() {}, command: (...args) => commands.push(args) });
  toolbar().onFormat('bold'); toolbar().onFormat('size', 18); toolbar().onFormat('italic'); toolbar().onFormat('underline'); toolbar().onFormat('color', '#DC4869');
  assert.equal(JSON.stringify(commands), JSON.stringify([['bold', null], ['size', 18], ['italic', null], ['underline', null], ['color', '#DC4869']]));
  const runs = [{ text: '한글 ', bold: false, fontSize: 15 }, { text: '작성', bold: true, fontSize: 18 }, { text: ' 중', bold: false, fontSize: 15 }];
  input.props.onState({ change: true, focused: true, content: '한글 작성 중', runs, bold: true, size: 18, align: 'right', caret: null });
  assert.equal(f.blocks()[0].runs, runs); assert.equal(f.blocks()[0].align, 'right');
  assert.equal(f.blocks()[1].content, '제목'); assert.equal(f.blocks()[1].runs, undefined);
  assert.equal(toolbar().format.bold, true); assert.equal(toolbar().format.size, 18); assert.equal(toolbar().format.align, 'right');
});

test('cancelled decoration sessions preserve the exact writer block, including URI-only legacy images', () => {
  for (const decorated of [true, false]) {
    const f = screenFixture(); let tree = f.render();
    const block = { id: 'legacy', type: 'image', imageUrl: 'legacy-uri', ...(decorated ? { decoratedImage: { uri: 'legacy-uri', decorations: [{ id: 'text', text: '원본', x: 0.1, y: 0.2 }] } } : {}) };
    let editor = find(tree, n => n.type === 'BlogEditor'); editor.props.onChange([block]);
    editor = find(f.render(), n => n.type === 'BlogEditor'); editor.props.onEditImage(block);
    // Cancel leaves the seeded reference untouched; only Complete writes a new result.
    f.focus(); editor = find(f.render(), n => n.type === 'BlogEditor');
    assert.equal(editor.props.blocks[0], block); assert.equal(f.decoration.size, 0);
  }
});

test('existing up/down menu changes mixed block order and preserves the moved photo', () => {
  const f = editorFixture({});
  const photo = { id: 'photo', type: 'image', decoratedImage: { uri: 'original', decorations: [{ rotation: 15 }] } };
  f.onChange([{ id: 't', type: 'text', content: '본문' }, photo, { id: 'd', type: 'divider' }]);
  find(f.render(), n => n.type === 'ResizablePostImage').props.onSelect();
  function menuAction(text) { return find(f.render(), n => n.type === 'Pressable' && n.props?.children?.props?.children === text); }
  menuAction('위로 이동').props.onPress(); assert.equal(f.blocks()[0], photo);
  menuAction('아래로 이동').props.onPress(); assert.equal(f.blocks()[1], photo);
  assert.equal(f.blocks().map(b => b.id).join(), 't,photo,d');
});

test('new photo is inserted only on completion, uses the latest document, and cancellation leaves no block', () => {
  const f = screenFixture();
  const photo = { id: 'new-photo', type: 'image', decoratedImage: { uri: 'original', decorations: [] } };
  let editor = find(f.render(), n => n.type === 'BlogEditor');
  editor.props.onEditImage(photo, true);
  assert.equal(editor.props.blocks.length, 1);
  f.focus(); assert.equal(find(f.render(), n => n.type === 'BlogEditor').props.blocks.length, 1);
  editor = find(f.render(), n => n.type === 'BlogEditor'); editor.props.onEditImage(photo, true);
  editor.props.onChange(current => current.map(block => ({ ...block, content: '보존된 최신 본문' })));
  const result = { uri: 'original', decorations: [{ id: 'stroke', type: 'drawing', points: [{ x: 0.1, y: 0.2 }] }], photoTransform: { x: 0.1, y: 0, scale: 2, rotation: 15 } };
  f.decoration.set('write-new-photo', result); f.focus();
  const inserted = find(f.render(), n => n.type === 'BlogEditor').props.blocks;
  assert.equal(inserted[0].content, '보존된 최신 본문'); assert.equal(inserted[1].decoratedImage, result);
  assert.equal(inserted[2].type, 'text'); f.focus();
  assert.equal(find(f.render(), n => n.type === 'BlogEditor').props.blocks.length, 3);
});

test('preview has a direct labelled header button and shares the actual post renderer', () => {
  const f = screenFixture(); let tree = f.render();
  assert.equal(find(tree, n => n.props?.accessibilityLabel === '글 메뉴'), undefined);
  find(tree, n => n.props?.accessibilityLabel === '미리보기').props.onPress(); tree = f.render();
  assert.equal(find(tree, n => n.type === 'Modal').props.visible, true);
  const editor = find(tree, n => n.type === 'BlogEditor');
  assert.equal(find(tree, n => n.type === 'PostBlockRenderer').props.blocks, editor.props.blocks);
});

test('toolbar stays outside the document scroll above title and body', () => {
  const f = editorFixture({}); const tree = f.render();
  const scroll = find(tree, n => n.type === 'ScrollView');
  assert.equal(scroll.props.stickyHeaderIndices, undefined);
  assert.equal(tree.props.children[0].props.children.type, 'EditorToolbar');
  assert.equal(find(scroll, n => n.type === 'EditorToolbar'), undefined);
});

test('cursor insertion splits multiline authored runs without dropping styles or following blocks', () => {
  const { insertPostBlock } = load('services/postBlocks.ts', {});
  const runs = [{ text: '첫줄\n', bold: true, italic: true }, { text: '앞뒤', underline: true, fontFamily: 'serif', color: '#DC4869', backgroundColor: '#FFDF80' }];
  const source = { id: 'text', type: 'text', content: '첫줄\n앞뒤', runs };
  const image = { id: 'photo', type: 'image', imageUrl: 'original' };
  const next = insertPostBlock([source, image], { id: 'divider', type: 'divider' }, { id: 'text', offset: 4 });
  assert.equal(next.map(block => block.type).join(), 'text,divider,text,image');
  assert.equal(next[0].content, '첫줄\n앞'); assert.equal(next[2].content, '뒤');
  assert.equal(next[2].runs[0].underline, true); assert.equal(next[2].runs[0].backgroundColor, '#FFDF80');
  assert.equal(next[3], image); assert.equal(source.content, '첫줄\n앞뒤');
});

test('video picker creates a distinct playable media record and cancellation writes nothing', async () => {
  let options;
  const f = editorFixture({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async value => { options = value; return { canceled: false, assets: [{ uri: 'local-video.mp4', width: 1920, height: 1080 }] }; } });
  await find(f.render(), n => n.type === 'EditorToolbar').props.onVideo();
  assert.equal(options.mediaTypes.join(), 'videos');
  const video = f.blocks().find(block => block.type === 'video');
  assert.equal(video.video.uri, 'local-video.mp4'); assert.equal(video.video.aspectRatio, 16 / 9);
  assert.equal(video.imageUrl, undefined); assert.equal(f.edits.length, 0);
  const cancelled = editorFixture({ requestMediaLibraryPermissionsAsync: async () => ({ granted: true }), launchImageLibraryAsync: async () => ({ canceled: true }) });
  await find(cancelled.render(), n => n.type === 'EditorToolbar').props.onVideo();
  assert.equal(cancelled.blocks().length, 1);
});

test('place and poll records save and reopen as detached drafts, including voting results', () => {
  const f = dataFixture();
  const blocks = [{ id: 'v', type: 'video', video: { uri: 'local-video', aspectRatio: 1 } }, { id: 'p', type: 'place', place: { name: '네일샵', address: '주소' } }, { id: 'vote', type: 'poll', poll: { question: '색상?', options: [{ id: 'a', text: '핑크', votes: 1 }, { id: 'b', text: '블루' }], votedOptionId: 'a' } }];
  const saved = f.savePostDraft({ ...draft, blocks });
  const reopened = f.initialPostBlocks(saved);
  assert.equal(JSON.stringify(reopened.slice(0, 3)), JSON.stringify(blocks));
  reopened[0].video.uri = 'changed'; reopened[1].place.name = 'changed'; reopened[2].poll.options[0].text = 'changed';
  assert.equal(saved.blocks[0].video.uri, 'local-video'); assert.equal(saved.blocks[1].place.name, '네일샵'); assert.equal(saved.blocks[2].poll.options[0].text, '핑크');
});

test('toolbar exposes exactly two rows and compact pickers with no alignment or extra insertion tools', () => {
  const h = hooks();
  const native = { Platform: { OS: 'web' }, StyleSheet: { create: x => x }, Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View' };
  const Toolbar = load('components/EditorToolbar.tsx', { react: h.react, 'react-native': native, '@expo/vector-icons': { Ionicons: 'Ionicons' }, '@/constants/colors': { COLORS: {} }, '@/constants/typography': load('constants/typography.ts', {}), './WritingSheet': { default: 'WritingSheet', __esModule: true }, './WritingDropdown': { default: 'WritingDropdown', __esModule: true } }).default;
  const tree = h.render(() => Toolbar({ hasSelection: true, format: { size: 18, bold: true }, onFormat() {} }));
  const rows = tree.props.children.filter(child => child.type === 'ScrollView');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].props.children.map(child => child.props.label).join(), '사진,동영상,구분선,장소,투표');
  assert.equal(rows[1].props.children.map(child => child.props.label).join(), '폰트,크기,글자 굵게,글자 기울임,글자 밑줄,글자 색상,글자 배경색');
});

test('font and size share measured dropdowns; selection applies commands, cancel does not, and iOS waits for dismissal', () => {
  for (const OS of ['web', 'ios']) {
    const h = hooks(), commands = [];
    const Toolbar = load('components/EditorToolbar.tsx', { react: h.react, 'react-native': { Platform: { OS }, StyleSheet: { create: x => x }, Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View' }, '@expo/vector-icons': { Ionicons: 'Ionicons' }, '@/constants/colors': { COLORS: {} }, '@/constants/typography': load('constants/typography.ts', {}), './WritingSheet': { default: 'WritingSheet', __esModule: true }, './WritingDropdown': { default: 'WritingDropdown', __esModule: true } }).default;
    const render = () => h.render(() => Toolbar({ hasSelection: true, format: { size: 15, fontFamily: 'system' }, onFormat: (...args) => commands.push(args) }));
    for (const [label, kind, value] of [['크기', 'size', 18], ['폰트', 'fontFamily', 'serif']]) {
      const trigger = find(render(), node => node.props?.label === label);
      trigger.props.anchorRef.current = { measureInWindow: callback => callback(80, 96, 40, 40) };
      trigger.props.onPress();
      let tree = render(); let menu = find(tree, node => node.type === 'WritingDropdown');
      assert.equal(menu.props.visible, true); assert.equal(menu.props.anchor.y, 96);
      assert.equal(find(tree, node => node.type === 'WritingSheet').props.visible, false);
      menu.props.onClose(); assert.equal(find(render(), node => node.type === 'WritingDropdown').props.visible, false);
      const count = commands.length; trigger.props.onPress(); menu = find(render(), node => node.type === 'WritingDropdown');
      menu.props.onSelect(value);
      assert.equal(find(render(), node => node.type === 'WritingDropdown').props.visible, false);
      if (OS === 'ios') { assert.equal(commands.length, count); menu.props.onDismiss(); menu.props.onDismiss(); }
      assert.equal(commands.length, count + 1); assert.equal(commands.at(-1).join(), `${kind},${value}`);
    }
  }
});

test('poll input enforces two nonempty options and cancel never creates a block', () => {
  const h = hooks(); let saved, closed = 0;
  const Form = load('components/PostBlockForm.tsx', { react: h.react, 'react-native': { Platform: { OS: 'web' }, StyleSheet: { create: x => x }, Pressable: 'Pressable', TextInput: 'TextInput', Text: 'Text', View: 'View' }, './WritingSheet': { default: 'WritingSheet', __esModule: true }, '@/constants/colors': { COLORS: {} }, '@/constants/typography': load('constants/typography.ts', {}) }).default;
  const render = () => h.render(() => Form({ type: 'poll', onSave: patch => { saved = patch; }, onClose: () => { closed++; } }));
  let tree = render(); assert.equal(find(tree, n => n.props?.accessibilityLabel === '블록 저장').props.disabled, true);
  find(tree, n => n.props?.accessibilityLabel === '투표 질문').props.onChangeText('컬러?');
  find(tree, n => n.props?.accessibilityLabel === '투표 선택지 1').props.onChangeText('핑크');
  assert.equal(find(render(), n => n.props?.accessibilityLabel === '블록 저장').props.disabled, true);
  find(render(), n => n.props?.accessibilityLabel === '투표 선택지 2').props.onChangeText('블루');
  tree = render(); assert.equal(find(tree, n => n.props?.accessibilityLabel === '선택지 1 삭제').props.disabled, true);
  assert.equal(find(tree, n => n.props?.accessibilityLabel === '블록 저장').props.disabled, false);
  tree.props.onClose(); assert.equal(closed, 1); assert.equal(saved, undefined);
  find(tree, n => n.props?.accessibilityLabel === '블록 저장').props.onPress();
  assert.equal(saved.poll.options.map(option => option.text).join(), '핑크,블루');
});

test('video renderer uses native controls and detail voting writes once while preview is readonly', () => {
  const h = hooks(); const sources = [];
  const Extra = load('components/PostExtraBlock.tsx', { react: h.react, 'expo-video': { useVideoPlayer: uri => { sources.push(uri); return 'player'; }, VideoView: 'VideoView' }, 'react-native': { StyleSheet: { create: x => x }, Pressable: 'Pressable', Text: 'Text', View: 'View' }, '@/constants/colors': { COLORS: {} }, '@/constants/typography': load('constants/typography.ts', {}) }).default;
  const video = h.render(() => Extra({ block: { id: 'v', type: 'video', video: { uri: 'local.mp4', aspectRatio: 1 } } }));
  const playerView = video.type(video.props);
  assert.equal(playerView.props.player, 'player'); assert.equal(playerView.props.nativeControls, true); assert.equal(sources.join(), 'local.mp4');
  const block = { id: 'p', type: 'poll', poll: { question: '색상?', options: [{ id: 'a', text: '핑크' }, { id: 'b', text: '블루' }] } };
  const preview = h.render(() => Extra({ block, interactive: false }));
  assert.equal(find(preview, n => n.type === 'Pressable').props.disabled, true);
  const tree = h.render(() => Extra({ block, interactive: true }));
  const vote = find(tree, n => n.type === 'Pressable').props.onPress; vote(); vote();
  assert.equal(block.poll.options[0].votes, 1); assert.equal(block.poll.votedOptionId, 'a');
  assert.equal(find(h.render(() => Extra({ block, interactive: true })), n => n.type === 'Pressable').props.disabled, true);
});
