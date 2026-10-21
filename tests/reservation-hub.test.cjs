const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, data) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: () => data, Date });
  return module.exports;
}
test('hub filters actual fields without mutating shop order', () => {
  const service = load('services/reservationHub.ts', {});
  const shops = [{ id: 'far', distance: '3km', rating: 5, isOpen: false }, { id: 'near', distance: '1km', rating: 4, isOpen: true }];
  assert.equal(service.discoverShops(shops, 'nearby')[0].id, 'near');
  assert.equal(service.discoverShops(shops, 'rating')[0].id, 'far');
  assert.equal(service.discoverShops(shops, 'open').length, 1);
  assert.equal(shops[0].id, 'far');
});
test('upcoming excludes past, cancelled, completed and other users and sorts chronologically', () => {
  const service = load('services/reservationHub.ts', {});
  const base = { userId: 'me', date: '2026-10-02', time: '13:00', status: 'pending' };
  const result = service.upcomingReservations([
    { ...base, id: 'later' }, { ...base, id: 'earlier', time: '10:00' },
    { ...base, id: 'past', date: '2026-09-01' }, { ...base, status: 'cancelled' },
    { ...base, status: 'completed' }, { ...base, userId: 'other' },
  ], 'me', new Date(2026, 9, 1));
  assert.equal(result.map(x => x.id).join(','), 'earlier,later');
});
test('demo booking dates cross year boundary; duplicate saves do not append twice', () => {
  const reservations = [];
  const service = load('services/reservationHub.ts', { reservations });
  const dates = service.demoBookingDates(new Date(2026, 11, 31));
  assert.equal(dates[0].date, '2027-01-01');
  assert.equal(dates[4].date, '2027-01-05');
  service.saveDemoReservation({ id: 'same', status: 'confirmed' });
  service.saveDemoReservation({ id: 'same', status: 'confirmed' });
  assert.equal(reservations.length, 1);
  assert.equal(reservations[0].status, 'pending');
});
test('shared reactions and comments propagate once across duplicate object references', () => {
  const post = { id: 'p', commentCount: 4 };
  const detached = { ...post };
  const comments = [];
  const service = load('services/postInteractions.ts', { allPosts: [post], publicPosts: [post, detached], shopPosts: [], comments });
  let notifications = 0;
  const off = service.subscribePostInteractions(() => notifications++);
  service.togglePostLike('p'); service.togglePostSave('p');
  assert.ok(service.getPostInteractions().likedIds.has('p'));
  assert.ok(service.getPostInteractions().savedIds.has('p'));
  service.togglePostLike('p');
  assert.equal(service.getPostInteractions().likedIds.has('p'), false);
  assert.equal(notifications, 3);
  off();
  service.addLocalComment({ id: 'c', postId: 'p' });
  service.addLocalComment({ id: 'c', postId: 'p' });
  assert.equal(post.commentCount, 5);
  assert.equal(detached.commentCount, 5);
  assert.equal(comments.length, 1);
});
