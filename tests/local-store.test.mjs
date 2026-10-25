import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_DATA_KEY,
  readLocalData,
  replaceLocalData,
  validateLocalData,
  saveLocalProfile,
  resetLocalData,
  createLocalTask,
  updateLocalTask,
  toggleLocalTask,
  deleteLocalTask,
  deleteAllLocalTasks,
  addLocalCategory,
  createLocalNote,
  updateLocalNote,
  deleteLocalNote,
  storageErrorMessage,
} from "../src/lib/local-store.ts";

function storage() {
  const values = new Map();
  let fail = false;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (fail) throw new DOMException("Full", "QuotaExceededError");
      values.set(key, value);
    },
    failWrites: () => {
      fail = true;
    },
  };
}
const input = (title = "Study Python") => ({
  title,
  date: "2026-10-25",
  time: "09:00:00",
  priority: "high",
  category: "Study",
});
function workspace() {
  const store = storage();
  const profile = saveLocalProfile(" Kingsley ", store);
  return { store, id: profile.id };
}

test("name-only setup needs no server and persists a stable local profile", () => {
  const store = storage();
  const profile = saveLocalProfile(" Kingsley ", store);
  assert.equal(profile.name, "Kingsley");
  assert.equal(readLocalData(store).profile.id, profile.id);
  assert.equal(saveLocalProfile("Edet", store).id, profile.id);
  assert.equal(readLocalData(store).profile.name, "Edet");
  assert.throws(() => saveLocalProfile("   ", store), /enter your name/);
});

test("tasks persist create, edit and completion changes without disturbing other tasks", () => {
  const { store, id } = workspace();
  const first = createLocalTask(id, input(), store);
  const second = createLocalTask(id, input("Read"), store);
  updateLocalTask(id, first.id, { title: "Learn TypeScript", priority: "medium" }, store);
  toggleLocalTask(id, first.id, store);
  const completed = readLocalData(store).tasks.find((task) => task.id === first.id);
  assert.equal(completed.title, "Learn TypeScript");
  assert.equal(completed.completed, true);
  assert(completed.completed_at);
  toggleLocalTask(id, first.id, store);
  assert.equal(readLocalData(store).tasks.find((task) => task.id === first.id).completed_at, null);
  deleteLocalTask(id, first.id, store);
  assert.deepEqual(
    readLocalData(store).tasks.map((task) => task.id),
    [second.id],
  );
});

test("notes persist edits and deletion; deleting all tasks keeps notes and profile", () => {
  const { store, id } = workspace();
  createLocalTask(id, input(), store);
  const note = createLocalNote(id, { title: "Functions", content: "Reusable code" }, store);
  updateLocalNote(id, note.id, { title: "Closures", content: "Remember lexical scope" }, store);
  deleteAllLocalTasks(id, store);
  assert.equal(readLocalData(store).tasks.length, 0);
  assert.equal(readLocalData(store).notes[0].title, "Closures");
  assert.equal(readLocalData(store).profile.id, id);
  deleteLocalNote(id, note.id, store);
  assert.equal(readLocalData(store).notes.length, 0);
});

test("categories are trimmed, deduplicated and survive profile edits", () => {
  const { store, id } = workspace();
  addLocalCategory(id, " Reading ", store);
  addLocalCategory(id, "Reading", store);
  saveLocalProfile("New name", store);
  assert.deepEqual(readLocalData(store).categories, ["Reading"]);
});

test("a complete backup restores profile, tasks, notes and custom categories in a new browser", () => {
  const { store, id } = workspace();
  createLocalTask(id, input(), store);
  createLocalNote(id, { title: "Learning", content: "Saved" }, store);
  addLocalCategory(id, "My category", store);
  const exported = JSON.parse(JSON.stringify({ app: "Vin Tracker", ...readLocalData(store) }));
  const other = storage();
  replaceLocalData(exported, other);
  assert.deepEqual(readLocalData(other), exported);
  assert.equal(readLocalData(other).tasks[0].user_id, id);
});

test("invalid backups, future versions and mismatched ownership leave current data untouched", () => {
  const { store, id } = workspace();
  createLocalTask(id, input(), store);
  const before = store.getItem(LOCAL_DATA_KEY);
  for (const invalid of [
    null,
    {},
    { ...readLocalData(store), schemaVersion: 2 },
    {
      ...readLocalData(store),
      tasks: [{ ...readLocalData(store).tasks[0], user_id: "different-profile" }],
    },
    { ...readLocalData(store), notes: [null] },
    { ...readLocalData(store), tasks: [{ ...readLocalData(store).tasks[0], date: "2026-02-30" }] },
    { ...readLocalData(store), tasks: [{ ...readLocalData(store).tasks[0], time: "25:99:00" }] },
  ]) {
    assert.throws(() => replaceLocalData(invalid, store));
    assert.equal(store.getItem(LOCAL_DATA_KEY), before);
  }
  assert.throws(() => createLocalTask("other-id", input(), store), /profile/);
  assert.equal(store.getItem(LOCAL_DATA_KEY), before);
});

test("corrupt existing data is never silently replaced during signup or mutation", () => {
  const store = storage();
  store.setItem(LOCAL_DATA_KEY, "broken json");
  assert.throws(() => readLocalData(store), /left untouched/);
  assert.throws(() => saveLocalProfile("Kingsley", store), /left untouched/);
  assert.equal(store.getItem(LOCAL_DATA_KEY), "broken json");
});

test("storage-full errors do not claim a successful save or change existing data", () => {
  const { store, id } = workspace();
  const before = store.getItem(LOCAL_DATA_KEY);
  store.failWrites();
  assert.throws(() => createLocalTask(id, input(), store), { name: "QuotaExceededError" });
  assert.equal(store.getItem(LOCAL_DATA_KEY), before);
  assert.match(
    storageErrorMessage(new DOMException("Full", "QuotaExceededError")),
    /storage is full/,
  );
});

test("explicit local reset clears only the app's data, leaving unrelated and legacy storage intact", () => {
  const { store, id } = workspace();
  createLocalTask(id, input(), store);
  store.setItem("previous-auth-session", "preserve");
  store.setItem("other-app", "preserve");
  resetLocalData(store);
  assert.equal(readLocalData(store).profile, null);
  assert.deepEqual(readLocalData(store).tasks, []);
  assert.equal(store.getItem("previous-auth-session"), "preserve");
  assert.equal(store.getItem("other-app"), "preserve");
});
