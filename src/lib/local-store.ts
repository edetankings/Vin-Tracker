import type { Task, TaskInput } from "./tasks";
import type { Note, NoteInput } from "./notes";

export const LOCAL_DATA_KEY = "vin-tracker-local-v1";
export const LOCAL_DATA_EVENT = "vin-tracker-data-changed";
export type LocalProfile = { id: string; name: string };
export type LocalData = {
  schemaVersion: 1;
  profile: LocalProfile | null;
  tasks: Task[];
  notes: Note[];
  categories: string[];
};
type DataStorage = Pick<Storage, "getItem" | "setItem">;
const emptyData = (): LocalData => ({
  schemaVersion: 1,
  profile: null,
  tasks: [],
  notes: [],
  categories: [],
});
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string";
const nullableText = (value: unknown) => value === null || text(value);
const timestamp = (value: unknown) => text(value) && !Number.isNaN(Date.parse(value));

function validDay(value: unknown): boolean {
  if (!text(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
const validTime = (value: unknown) =>
  value === null || (text(value) && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value));

export function storageErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "QuotaExceededError")
    return "This browser's storage is full. Export a backup and free some space before trying again.";
  if (error instanceof Error && error.name === "SecurityError")
    return "This browser is blocking saved data. Allow site storage and try again.";
  return error instanceof Error
    ? error.message
    : "Could not save your changes in this browser. Please try again.";
}

export function validateLocalData(value: unknown): LocalData {
  if (
    !record(value) ||
    value["schemaVersion"] !== 1 ||
    !Array.isArray(value["tasks"]) ||
    !Array.isArray(value["notes"]) ||
    !Array.isArray(value["categories"])
  )
    throw new Error(
      "This is not a supported Vin Tracker backup. Your existing data has not been changed.",
    );
  const profile = value["profile"];
  if (
    profile !== null &&
    (!record(profile) ||
      !text(profile["id"]) ||
      !profile["id"] ||
      !text(profile["name"]) ||
      !profile["name"].trim())
  )
    throw new Error("The saved profile is invalid. Your existing data has not been changed.");
  const owner = record(profile) ? profile["id"] : null;
  const ids = new Set<string>();
  for (const task of value["tasks"]) {
    if (
      !record(task) ||
      !text(task["id"]) ||
      !task["id"] ||
      ids.has(task["id"]) ||
      task["user_id"] !== owner ||
      !owner ||
      !text(task["title"]) ||
      !task["title"].trim() ||
      !validDay(task["date"]) ||
      !validTime(task["time"]) ||
      !["low", "medium", "high"].includes(String(task["priority"])) ||
      !nullableText(task["category"]) ||
      typeof task["completed"] !== "boolean" ||
      !(task["completed_at"] === null || timestamp(task["completed_at"])) ||
      !timestamp(task["created_at"]) ||
      !timestamp(task["updated_at"])
    )
      throw new Error("The saved tasks are invalid. Your existing data has not been changed.");
    ids.add(task["id"]);
  }
  ids.clear();
  for (const note of value["notes"]) {
    if (
      !record(note) ||
      !text(note["id"]) ||
      !note["id"] ||
      ids.has(note["id"]) ||
      note["user_id"] !== owner ||
      !owner ||
      !text(note["title"]) ||
      !note["title"].trim() ||
      !text(note["content"]) ||
      !timestamp(note["created_at"]) ||
      !timestamp(note["updated_at"])
    )
      throw new Error("The saved notes are invalid. Your existing data has not been changed.");
    ids.add(note["id"]);
  }
  if (!value["categories"].every((name) => text(name) && !!name.trim()))
    throw new Error("The saved categories are invalid. Your existing data has not been changed.");
  return value as LocalData;
}

export function readLocalData(storage: DataStorage = window.localStorage): LocalData {
  const raw = storage.getItem(LOCAL_DATA_KEY);
  if (raw === null) return emptyData();
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Your saved workspace could not be read. It has been left untouched; do not clear browser data if you need to recover it.",
    );
  }
  return validateLocalData(value);
}

export function replaceLocalData(
  value: unknown,
  storage: DataStorage = window.localStorage,
): LocalData {
  const data = validateLocalData(value);
  storage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LOCAL_DATA_EVENT));
  return data;
}

function change(update: (data: LocalData) => void, storage?: DataStorage) {
  const data = readLocalData(storage);
  update(data);
  return replaceLocalData(data, storage);
}
function requireProfile(data: LocalData, userId: string | null) {
  if (!userId || data.profile?.id !== userId) throw new Error("Set up your local profile first.");
}
export function saveLocalProfile(rawName: string, storage?: DataStorage) {
  const name = rawName.trim();
  if (!name) throw new Error("Please enter your name.");
  if (name.length > 80) throw new Error("Please use a name of 80 characters or fewer.");
  const data = change((data) => {
    data.profile = { id: data.profile?.id ?? crypto.randomUUID(), name };
  }, storage);
  return data.profile!;
}
export function resetLocalData(storage?: DataStorage) {
  return replaceLocalData(emptyData(), storage);
}
export function createLocalTask(userId: string | null, input: TaskInput, storage?: DataStorage) {
  const now = new Date().toISOString();
  const task: Task = {
    ...input,
    title: input.title.trim(),
    id: crypto.randomUUID(),
    user_id: userId ?? "",
    completed: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
  };
  change((data) => {
    requireProfile(data, userId);
    data.tasks.push(task);
  }, storage);
  return task;
}
export function updateLocalTask(
  userId: string | null,
  id: string,
  changes: Partial<TaskInput>,
  storage?: DataStorage,
) {
  change((data) => {
    requireProfile(data, userId);
    const task = data.tasks.find((task) => task.id === id);
    if (!task) throw new Error("This task no longer exists.");
    Object.assign(task, changes, { updated_at: new Date().toISOString() });
  }, storage);
}
export function toggleLocalTask(userId: string | null, id: string, storage?: DataStorage) {
  change((data) => {
    requireProfile(data, userId);
    const task = data.tasks.find((task) => task.id === id);
    if (!task) throw new Error("This task no longer exists.");
    task.completed = !task.completed;
    task.completed_at = task.completed ? new Date().toISOString() : null;
    task.updated_at = new Date().toISOString();
  }, storage);
}
export function deleteLocalTask(userId: string | null, id: string, storage?: DataStorage) {
  change((data) => {
    requireProfile(data, userId);
    data.tasks = data.tasks.filter((task) => task.id !== id);
  }, storage);
}
export function deleteAllLocalTasks(userId: string | null, storage?: DataStorage) {
  change((data) => {
    requireProfile(data, userId);
    data.tasks = [];
  }, storage);
}
export function addLocalCategory(userId: string | null, rawName: string, storage?: DataStorage) {
  const name = rawName.trim();
  if (!name) throw new Error("Enter a category name.");
  change((data) => {
    requireProfile(data, userId);
    if (!data.categories.includes(name)) data.categories.push(name);
  }, storage);
}
export function createLocalNote(userId: string | null, input: NoteInput, storage?: DataStorage) {
  const now = new Date().toISOString();
  const note: Note = {
    ...input,
    title: input.title.trim(),
    id: crypto.randomUUID(),
    user_id: userId ?? "",
    created_at: now,
    updated_at: now,
  };
  change((data) => {
    requireProfile(data, userId);
    data.notes.push(note);
  }, storage);
  return note;
}
export function updateLocalNote(
  userId: string | null,
  id: string,
  changes: NoteInput,
  storage?: DataStorage,
) {
  change((data) => {
    requireProfile(data, userId);
    const note = data.notes.find((note) => note.id === id);
    if (!note) throw new Error("This note no longer exists.");
    Object.assign(note, changes, {
      title: changes.title.trim(),
      updated_at: new Date().toISOString(),
    });
  }, storage);
}
export function deleteLocalNote(userId: string | null, id: string, storage?: DataStorage) {
  change((data) => {
    requireProfile(data, userId);
    data.notes = data.notes.filter((note) => note.id !== id);
  }, storage);
}
