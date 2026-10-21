const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("fs");
const vm = require("vm");
function load(file, mocks, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => {
        if (name in mocks) return mocks[name];
        throw Error("Missing mock " + name);
      },
      Date,
      ...globals,
    },
  );
  return module.exports;
}
test("booking rejects wrong shop-design, invalid time, past and occupied slots; cancellation frees slot", () => {
  const reservations = [];
  let writes = 0;
  const data = {
    currentUser: { id: "me" },
    shops: [{ id: "s" }],
    designs: [
      { id: "d", availableShopIds: ["s"] },
      { id: "wrong", availableShopIds: [] },
    ],
    reservations,
    commitData: () => writes++,
  };
  const service = load("services/reservationHub.ts", {
    "@/data/mockData": data,
  });
  const value = {
    id: "r",
    userId: "me",
    shopId: "s",
    designId: "d",
    date: "2099-01-01",
    time: "14:00",
    status: "pending",
  };
  assert.throws(() =>
    service.saveDemoReservation({ ...value, designId: "wrong" }),
  );
  assert.throws(() => service.saveDemoReservation({ ...value, time: "25:00" }));
  assert.throws(() =>
    service.saveDemoReservation({ ...value, date: "2000-01-01" }),
  );
  service.saveDemoReservation(value);
  assert.throws(() => service.saveDemoReservation({ ...value, id: "r2" }));
  service.changeReservationStatus("r", "cancelled");
  assert.throws(() => service.changeReservationStatus("r", "confirmed"));
  service.saveDemoReservation({ ...value, id: "r2" });
  service.changeReservationStatus("r2", "confirmed");
  service.changeReservationStatus("r2", "completed");
  assert.equal(writes, 5);
  assert.equal(reservations[0].status, "completed");
});
test("web snapshot roundtrip, corrupt data, unsupported version and quota error are explicit", () => {
  let stored = null;
  const storage = {
    getItem: () => stored,
    setItem: (k, v) => {
      stored = v;
    },
  };
  const service = load(
    "services/storage.ts",
    { "react-native": { Platform: { OS: "web" } }, "expo-file-system": {} },
    { window: { localStorage: storage } },
  );
  service.writeStore({ preferences: { savedIds: ["p"] } });
  assert.equal(service.readStore().preferences.savedIds[0], "p");
  stored = "{broken";
  assert.equal(service.readStore(), null);
  assert.ok(service.storageError);
  stored = '{"version":100}';
  assert.equal(service.readStore(), null);
  storage.setItem = () => {
    throw Error("quota");
  };
  assert.throws(() => service.writeStore({}));
  assert.ok(service.storageError);
});
test("saved posts and comments survive a new service instance without duplicating base counts", () => {
  const post = { id: "p", commentCount: 0 };
  const data = {
    allPosts: [post],
    publicPosts: [post],
    shopPosts: [],
    comments: [],
    preferences: { likedIds: [], savedIds: [] },
    commitData: () => {},
  };
  const service = load("services/postInteractions.ts", {
    "@/data/mockData": data,
  });
  service.togglePostLike("p");
  service.togglePostSave("p");
  service.addLocalComment({ id: "c", postId: "p" });
  service.addLocalComment({ id: "c", postId: "p" });
  const reload = load("services/postInteractions.ts", {
    "@/data/mockData": data,
  });
  assert.ok(reload.getPostInteractions().likedIds.has("p"));
  assert.ok(reload.getPostInteractions().savedIds.has("p"));
  assert.equal(post.commentCount, 1);
  assert.equal(data.comments.length, 1);
});
