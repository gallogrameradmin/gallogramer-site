/**
 * Хранилище состояния бота на Yandex Object Storage.
 * Один JSON-файл `_state/bot.json` в bucket gallogramer-photos.
 *
 * На локальной разработке (без YC_S3_KEY) — fallback в data/state.json.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  STATE_BUCKET,
  STATE_KEY,
  getObjectJSON,
  putObjectJSON,
} from "./s3";

const localDir = join(process.cwd(), "data");
const localPath = join(localDir, "state.json");

export type ListedItem = { kind: "photo" | "video"; filename: string };

type State = {
  greeted: string[];
  uploadMode: boolean;
  lastListedItems: ListedItem[];
};

const DEFAULTS: State = {
  greeted: [],
  uploadMode: false,
  lastListedItems: [],
};

function hasS3() {
  return !!(process.env.YC_S3_KEY && process.env.YC_S3_SECRET);
}

// ─── Local fallback (для npm run bot без S3) ───
function loadLocal(): State {
  try {
    if (!existsSync(localPath)) return { ...DEFAULTS };
    const raw = readFileSync(localPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...DEFAULTS,
      ...parsed,
      greeted: parsed.greeted ?? [],
      lastListedItems: parsed.lastListedItems ?? [],
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveLocal(state: State) {
  try {
    if (!existsSync(localDir)) mkdirSync(localDir, { recursive: true });
    writeFileSync(localPath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("[storage] local save failed:", err);
  }
}

async function load(): Promise<State> {
  if (!hasS3()) return loadLocal();
  try {
    const raw = await getObjectJSON<Partial<State>>(STATE_BUCKET, STATE_KEY);
    if (!raw) return { ...DEFAULTS };
    return {
      ...DEFAULTS,
      ...raw,
      greeted: raw.greeted ?? [],
      lastListedItems: raw.lastListedItems ?? [],
    };
  } catch (err) {
    console.error("[storage] S3 load failed:", err);
    return { ...DEFAULTS };
  }
}

async function save(state: State): Promise<void> {
  if (!hasS3()) {
    saveLocal(state);
    return;
  }
  try {
    await putObjectJSON(STATE_BUCKET, STATE_KEY, state);
  } catch (err) {
    console.error("[storage] S3 save failed:", err);
  }
}

// ─── greeted clients ───

export async function hasGreeted(clientId: string | number): Promise<boolean> {
  const s = await load();
  return s.greeted.includes(String(clientId));
}

export async function markGreeted(clientId: string | number): Promise<void> {
  const s = await load();
  if (!s.greeted.includes(String(clientId))) {
    s.greeted.push(String(clientId));
    await save(s);
  }
}

// ─── upload mode ───

export async function isUploadMode(): Promise<boolean> {
  const s = await load();
  return s.uploadMode;
}

export async function setUploadMode(on: boolean): Promise<void> {
  const s = await load();
  s.uploadMode = on;
  await save(s);
}

// ─── last listed items (для /del N) ───

export async function setLastListedItems(items: ListedItem[]): Promise<void> {
  const s = await load();
  s.lastListedItems = items;
  await save(s);
}

export async function getLastListedItems(): Promise<ListedItem[]> {
  const s = await load();
  return s.lastListedItems;
}
