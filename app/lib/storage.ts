/**
 * Хранилище состояния бота — двойной режим:
 *   • Локально (нет UPSTASH_REDIS_REST_URL): пишем в data/state.json.
 *   • На Vercel (есть Upstash env-vars): пишем в Upstash Redis.
 *
 * Все функции — async, потому что Redis сетевой.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { Redis } from "@upstash/redis";

const dataDir = join(process.cwd(), "data");
const filePath = join(dataDir, "state.json");

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

const REDIS_KEY = "gallogramer:bot:state";

// ─── Redis (prod) ───
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// ─── File (dev) ───
function loadFile(): State {
  try {
    if (!existsSync(filePath)) return { ...DEFAULTS };
    const raw = readFileSync(filePath, "utf8");
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

function saveFile(state: State) {
  try {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("[storage] file save failed:", err);
  }
}

// ─── unified load/save ───
async function load(): Promise<State> {
  const r = getRedis();
  if (r) {
    try {
      const raw = await r.get<State>(REDIS_KEY);
      if (!raw) return { ...DEFAULTS };
      return {
        ...DEFAULTS,
        ...raw,
        greeted: raw.greeted ?? [],
        lastListedItems: raw.lastListedItems ?? [],
      };
    } catch (err) {
      console.error("[storage] redis load failed:", err);
      return { ...DEFAULTS };
    }
  }
  return loadFile();
}

async function save(state: State): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.set(REDIS_KEY, state);
      return;
    } catch (err) {
      console.error("[storage] redis save failed:", err);
      return;
    }
  }
  saveFile(state);
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
