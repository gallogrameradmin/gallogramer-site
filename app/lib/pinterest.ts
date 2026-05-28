/**
 * Тонкий клиент Pinterest API v5.
 * Документация: https://developers.pinterest.com/docs/api/v5/
 */

const API_BASE = "https://api.pinterest.com/v5";

export type PinImage = {
  url: string;
  width: number;
  height: number;
};

export type PinMedia = {
  media_type?: string;
  images?: {
    "150x150"?: PinImage;
    "400x300"?: PinImage;
    "600x"?: PinImage;
    "1200x"?: PinImage;
    originals?: PinImage;
  };
};

export type Pin = {
  id: string;
  created_at: string;
  link?: string | null;
  title?: string | null;
  description?: string | null;
  alt_text?: string | null;
  board_id?: string | null;
  board_section_id?: string | null;
  media?: PinMedia;
};

export type PaginatedResponse<T> = {
  items: T[];
  bookmark?: string | null;
};

export type Board = {
  id: string;
  name: string;
  description?: string;
  pin_count: number;
};

class PinterestError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function tg<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PinterestError(
      `Pinterest API ${res.status} ${res.statusText}`,
      res.status,
      body,
    );
  }
  return body as T;
}

/** Список пинов авторизованного пользователя (всё или из конкретной доски) */
export async function listPins(
  token: string,
  opts: { boardId?: string; pageSize?: number; bookmark?: string } = {},
): Promise<PaginatedResponse<Pin>> {
  const params = new URLSearchParams();
  params.set("page_size", String(opts.pageSize ?? 100));
  if (opts.bookmark) params.set("bookmark", opts.bookmark);

  const path = opts.boardId
    ? `/boards/${opts.boardId}/pins?${params}`
    : `/pins?${params}`;

  return tg(token, path);
}

/** Все пины с автоматической пагинацией (до hardLimit, чтобы не зависнуть навсегда) */
export async function listAllPins(
  token: string,
  opts: { boardId?: string; hardLimit?: number } = {},
): Promise<Pin[]> {
  const hardLimit = opts.hardLimit ?? 1000;
  const all: Pin[] = [];
  let bookmark: string | undefined;

  while (all.length < hardLimit) {
    const res = await listPins(token, {
      boardId: opts.boardId,
      pageSize: 100,
      bookmark,
    });
    all.push(...res.items);
    if (!res.bookmark || res.items.length === 0) break;
    bookmark = res.bookmark;
  }

  return all;
}

/** Доски пользователя */
export async function listBoards(token: string): Promise<Board[]> {
  const res = await tg<PaginatedResponse<Board>>(
    token,
    "/boards?page_size=100",
  );
  return res.items;
}

/** Достать «лучший» image URL из пина — отдаёт самый крупный из доступных */
export function bestImage(pin: Pin): PinImage | null {
  const imgs = pin.media?.images;
  if (!imgs) return null;
  return (
    imgs.originals ??
    imgs["1200x"] ??
    imgs["600x"] ??
    imgs["400x300"] ??
    imgs["150x150"] ??
    null
  );
}

export { PinterestError };
