// Dependency-free handler/state regression tests. Native layout and gestures still
// require a device: this harness executes the real TS modules with host/hook doubles.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function load(file, mocks, globals = {}) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    ...globals,
    module, exports: module.exports,
    require: (name) => name in mocks ? mocks[name] : require(name),
  }, { filename: file });
  return module.exports;
}

function hooks() {
  const slots = [];
  let cursor = 0;
  let focus;
  const useMemo = (create, deps) => {
    const index = cursor++;
    if (!slots[index] || deps.some((dep, i) => !Object.is(dep, slots[index].deps[i]))) {
      slots[index] = { value: create(), deps };
    }
    return slots[index].value;
  };
  return {
    react: {
      ...React, useMemo,
      useCallback: (callback, deps) => useMemo(() => callback, deps),
      useRef: (value) => useMemo(() => ({ current: value }), []),
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], (next) => {
          slots[index] = typeof next === 'function' ? next(slots[index]) : next;
        }];
      },
    },
    router: { useFocusEffect: (callback) => { focus = callback; } },
    render(fn) { cursor = 0; return fn(); },
    focus() { focus(); },
  };
}

const post = (id) => ({ id, authorId: `author-${id}` });
function fixture(read) {
  const h = hooks();
  let hapticCalls = 0;
  const publicPosts = [post('1'), post('2')];
  const source = load('services/communityFeed.ts', { '@/data/mockData': { publicPosts } });
  const { useCommunityFeed } = load('hooks/useCommunityFeed.ts', {
    react: h.react, 'expo-router': h.router, '@/data/mockData': { publicPosts },
    '@/services/communityFeed': source,
    '@/services/refreshHaptic': { refreshHaptic: async () => { hapticCalls++; } },
  });
  return { ...h, publicPosts, hapticCalls: () => hapticCalls, render: () => h.render(() => useCommunityFeed(read)) };
}

test('initial data is synchronous; repeated focus does not fetch or replace unchanged rows', () => {
  let calls = 0;
  const f = fixture(() => { calls++; return []; });
  const first = f.render();
  assert.equal(first.posts.length, 2);
  assert.equal(first.refreshing, false);
  f.focus(); f.focus();
  assert.equal(f.render().posts, first.posts);
  assert.equal(calls, 0);
  const added = post('3');
  f.publicPosts.unshift(added);
  f.focus();
  assert.equal(f.render().posts[0].id, added.id);
  const edited = { ...added, title: 'edited' };
  f.publicPosts.splice(0, 1, edited);
  f.focus();
  assert.equal(f.render().posts[0].title, edited.title);
  edited.commentCount = 99;
  f.focus();
  assert.equal(f.render().posts[0].commentCount, 99);
});

test('rapid pulls share one read; old data stays until success, including focus during refresh', async () => {
  let calls = 0;
  let resolve;
  const f = fixture(() => { calls++; return new Promise((done) => { resolve = done; }); });
  const first = f.render();
  const pending = first.refresh();
  await Promise.all(Array.from({ length: 20 }, () => first.refresh()));
  f.focus();
  assert.equal(calls, 1);
  assert.equal(f.hapticCalls(), 1);
  assert.equal(f.render().refreshing, true);
  assert.equal(f.render().posts, first.posts);
  const next = [post('new'), ...first.posts];
  resolve(next);
  await pending;
  assert.equal(JSON.stringify(f.render().posts), JSON.stringify(next));
  assert.notEqual(f.render().posts, next);
  assert.equal(f.render().refreshing, false);
});

test('rejection and synchronous errors preserve data, release the lock, and allow retry', async () => {
  let attempt = 0;
  const f = fixture(() => {
    attempt++;
    if (attempt === 1) return Promise.reject(new Error('offline'));
    if (attempt === 2) throw new Error('read failed');
    return [];
  });
  const before = f.render().posts;
  for (let i = 0; i < 2; i++) {
    await f.render().refresh();
    const result = f.render();
    assert.equal(result.posts, before);
    assert.equal(result.refreshing, false);
    assert.ok(result.error);
  }
  await f.render().refresh();
  assert.equal(f.render().posts.length, 0);
  assert.equal(f.render().error, null);
});

test('refresh takes a detached snapshot and reflects in-place edits and empty results', async () => {
  const f = fixture();
  const before = f.render().posts;
  await f.render().refresh();
  assert.notEqual(f.render().posts, before);
  assert.notEqual(f.render().posts[0], f.publicPosts[0]);
  f.publicPosts[0].title = 'changed in place';
  await f.render().refresh();
  assert.equal(f.render().posts[0].title, 'changed in place');
  f.publicPosts.length = 0;
  f.focus();
  await f.render().refresh();
  assert.equal(f.render().posts.length, 0);
  assert.equal(f.render().refreshing, false);
});

test('refresh replaces rather than appends and removes duplicate IDs', async () => {
  const f = fixture(() => [post('new'), post('new')]);
  await f.render().refresh();
  assert.equal(f.render().posts.length, 1);
  assert.equal(f.render().posts[0].id, 'new');
});

test('haptics use light feedback and tolerate native rejection or synchronous failure', async () => {
  for (const failure of [false, 'async', 'sync']) {
    let calls = 0;
    const { refreshHaptic } = load('services/refreshHaptic.ts', {
      'expo-haptics': {
        ImpactFeedbackStyle: { Light: 'light' },
        impactAsync(style) {
          calls++;
          assert.equal(style, 'light');
          if (failure === 'sync') throw new Error('unsupported');
          return failure ? Promise.reject(new Error('unavailable')) : Promise.resolve();
        },
      },
    });
    await refreshHaptic();
    assert.equal(calls, 1);
  }
});

function elements(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(elements);
  return [tree, ...elements(tree.props?.children)];
}

test('large feeds retain unique IDs, stable card props and interactions across feed switches', () => {
  const h = hooks();
  const posts = Array.from({ length: 10000 }, (_, i) => post(String(i)));
  const state = { posts, refreshing: false, error: null, refresh: async () => {} };
  const navigated = [];
  const router = { push: (path) => navigated.push(path) };
  const interactions = { likedIds: new Set(), savedIds: new Set() };
  const toggle = (key, id) => {
    const next = new Set(interactions[key]);
    if (next.has(id)) next.delete(id); else next.add(id);
    interactions[key] = next;
  };
  const toggleLike = (id) => toggle('likedIds', id);
  const toggleSave = (id) => toggle('savedIds', id);
  const { default: Screen } = load('app/(tabs)/community.tsx', {
    react: h.react,
    'expo-router': { useRouter: () => router },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native': {
      Animated: { ScrollView: 'Pager', View: 'AnimatedView',
        Value: class { interpolate() { return 0; } }, event: () => () => {} },
      FlatList: 'FlatList', Image: 'Image', Pressable: 'Pressable',
      ScrollView: 'ScrollView', Text: 'Text', View: 'View',
      Platform: { select: (options) => options.default },
      StyleSheet: { create: (value) => value, hairlineWidth: 1 },
      useWindowDimensions: () => ({ width: 390 }),
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/components/BlogPostCard': { __esModule: true, default: 'Card' },
    '@/components/EmptyState': { __esModule: true, default: 'Empty' },
    '@/components/CommunityRefreshFeedback': { __esModule: true, default: 'Feedback' },
    '@/constants/colors': { COLORS: {}, RADIUS: {}, SPACING: {} },
    '@/constants/layout': { BOTTOM_NAV_CONTENT_INSET: 80, CONTENT_MAX_WIDTH: 600 },
    '@/constants/typography': { TYPOGRAPHY: {}, FONT_WEIGHT: { regular: '400', semibold: '600', bold: '700' } },
    '@/data/mockData': { currentUser: { id: 'me' }, users: [{ id: 'author-0', nickname: 'A' }] },
    '@/hooks/useCommunityFeed': { useCommunityFeed: () => state },
    '@/hooks/usePostInteractions': { usePostInteractions: () => ({ ...interactions, toggleLike, toggleSave }) },
  });
  const render = () => h.render(Screen);
  const lists = (tree) => elements(tree).filter((item) => item.type === 'FlatList');
  const tree = render();
  let [all, following] = lists(tree);
  assert.equal(all.props.data, posts);
  assert.equal(new Set(posts.map(all.props.keyExtractor)).size, 10000);
  assert.equal(all.props.onEndReached, undefined); // no fake endless duplication
  assert.equal(following.props.data.length, 0);
  const first = all.props.renderItem({ item: posts[0] });
  first.props.onOpen('0');
  assert.deepEqual(navigated, ['/post/0']);
  state.refreshing = true;
  all = lists(render())[0];
  assert.equal(all.props.scrollEnabled, false);
  assert.equal(elements(render()).find((item) => item.type === 'Pager').props.scrollEnabled, false);
  assert.equal(all.props.data, posts);
  const during = all.props.renderItem({ item: posts[0] });
  for (const key of Object.keys(first.props)) assert.equal(first.props[key], during.props[key]);
  first.props.onToggleLike('0');
  first.props.onToggleSave('0');
  const followButton = elements(following.props.ListHeaderComponent).find((item) => item.type === 'Pressable');
  followButton.props.onPress();
  [all, following] = lists(render());
  assert.equal(following.props.data.length, 1);
  for (const list of [all, following]) {
    const card = list.props.renderItem({ item: posts[0] });
    assert.equal(card.props.liked, true);
    assert.equal(card.props.saved, true);
    assert.equal(list.props.onRefresh, state.refresh);
  }
  const pager = elements(tree).find((item) => item.type === 'Pager');
  pager.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 390 } } });
  assert.equal(lists(render())[0].props.data, posts);
  assert.equal(elements(tree).filter((item) => item.type === 'ScrollView').length, 0);
});

test('identical successful reads report completion; failure and duplicate pulls do not', async () => {
  let rejectNext = false;
  const f = fixture(() => rejectNext ? Promise.reject(new Error('failed')) : []);
  assert.equal(f.render().refreshCompletion, 0);
  await f.render().refresh();
  assert.equal(f.render().refreshCompletion, 1);
  await f.render().refresh();
  assert.equal(f.render().refreshCompletion, 2);
  rejectNext = true;
  await f.render().refresh();
  assert.equal(f.render().refreshCompletion, 2);
  assert.equal(f.render().refreshing, false);
});

test('completion notice expires, hides on a new request and does not reappear after failure', () => {
  const h = hooks();
  const effects = [];
  let cursor = 0;
  let nextTimer = 0;
  const timers = new Map();
  const { default: Feedback } = load('components/CommunityRefreshFeedback.tsx', {
    react: { ...h.react, useEffect(callback, deps) {
      const i = cursor++;
      if (!effects[i] || deps.some((value, j) => value !== effects[i].deps[j])) {
        effects[i]?.cleanup?.();
        effects[i] = { deps, cleanup: callback() };
      }
    } },
    'react-native': { View: 'View', Text: 'Text', StyleSheet: { create: (styles) => styles } },
    '@/constants/colors': { COLORS: {}, RADIUS: {} },
    '@/constants/typography': { TYPOGRAPHY: {}, FONT_WEIGHT: { regular: '400', semibold: '600', bold: '700' } },
  }, {
    setTimeout(callback, duration) { assert.equal(duration, 1800); timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  });
  const render = (completion, refreshing = false) => {
    const run = () => { cursor = 0; return h.render(() => Feedback({ completion, refreshing })); };
    run(); return run(); // commit effect state
  };
  assert.equal(render(0), null);
  assert.ok(render(1));
  for (const callback of timers.values()) callback();
  assert.equal(render(1), null);
  assert.ok(render(2));
  assert.equal(render(2, true), null);
  assert.equal(render(2, false), null); // request failed, completion unchanged
  assert.ok(render(3));
  effects.forEach((effect) => effect.cleanup?.());
  assert.equal(timers.size, 0);
});
