"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Когда админка открыта через www.gallogramer.com (YC CDN не пропускает POST),
 * все API-вызовы редиректим напрямую в vercel.app. На vercel.app/localhost —
 * используем относительные пути.
 */
function apiBase(): string {
  if (typeof window === "undefined") return "";
  const h = window.location.hostname;
  if (h === "www.gallogramer.com" || h === "gallogramer.com") {
    return "https://gallogramer-site.vercel.app";
  }
  return "";
}

type MediaItem = {
  kind: "photo" | "video";
  key: string;
  url: string;
  mtimeMs: number;
  ago: string;
};

type UploadState = {
  filename: string;
  kind: "photo" | "video";
  progress: number; // 0..1
  done: boolean;
  error?: string;
};

const TOKEN_KEY = "gallogramer-admin-token";

export default function AdminClient() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Подтянуть токен из localStorage на маунте
  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) setToken(t);
    } catch {}
  }, []);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const t = tokenInput.trim();
    if (!t) return;
    // Проверка токена через /list — если 200, токен ок
    try {
      const r = await fetch(`${apiBase()}/api/admin/list`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) {
        setAuthError(r.status === 401 ? "Неверный пароль" : `Ошибка ${r.status}`);
        return;
      }
      localStorage.setItem(TOKEN_KEY, t);
      setToken(t);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Сеть недоступна");
    }
  };

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTokenInput("");
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <form onSubmit={onLogin} className="w-full max-w-sm">
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3">
            <span className="text-accent">/Admin</span> · Login
          </p>
          <h1 className="font-display font-medium tracking-[-0.03em] text-3xl md:text-4xl mb-8">
            Доступ к управлению<span className="text-accent">.</span>
          </h1>
          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
              Пароль
            </span>
            <input
              type="password"
              autoFocus
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-line py-3 text-base text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent transition-colors"
              placeholder="Введи ADMIN_TOKEN"
            />
          </label>
          {authError ? (
            <p className="mt-3 text-[11px] tracking-[0.12em] uppercase font-mono text-red-500">
              {authError}
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-6 w-full glass rounded-full px-6 py-3 font-mono text-sm uppercase tracking-[0.18em] text-fg hover:text-accent transition-colors"
          >
            Войти →
          </button>
        </form>
      </div>
    );
  }

  return <AuthedAdmin token={token} onLogout={onLogout} />;
}

function AuthedAdmin({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchList = useCallback(async () => {
    try {
      const r = await fetch(`${apiBase()}/api/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { items: MediaItem[] };
      setItems(data.items);
    } catch (err) {
      console.error("list fail:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const updateUpload = (filename: string, patch: Partial<UploadState>) => {
    setUploads((prev) =>
      prev.map((u) => (u.filename === filename ? { ...u, ...patch } : u)),
    );
  };

  const uploadOne = async (file: File, kind: "photo" | "video") => {
    const filename = file.name;
    setUploads((prev) => [
      ...prev,
      { filename, kind, progress: 0, done: false },
    ]);
    try {
      // 1. Получаем подписанный URL
      const signResp = await fetch(`${apiBase()}/api/admin/sign-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          contentType: file.type,
          originalName: file.name,
        }),
      });
      if (!signResp.ok) {
        const j = (await signResp.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `sign HTTP ${signResp.status}`);
      }
      const { url, key } = (await signResp.json()) as {
        url: string;
        key: string;
      };

      // 2. PUT в S3 с прогрессом через XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            updateUpload(filename, { progress: e.loaded / e.total });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 PUT ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

      // 3. Для фото — прочитаем dimensions через Image
      let w: number | undefined, h: number | undefined;
      if (kind === "photo") {
        try {
          const dim = await readImageDimensions(file);
          w = dim.w;
          h = dim.h;
        } catch {}
      } else {
        try {
          const dim = await readVideoDimensions(file);
          w = dim.w;
          h = dim.h;
        } catch {}
      }

      // 4. Финализация → регенерация манифеста
      const finResp = await fetch(`${apiBase()}/api/admin/finalize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kind, key, w, h }),
      });
      if (!finResp.ok) throw new Error(`finalize HTTP ${finResp.status}`);

      updateUpload(filename, { progress: 1, done: true });
    } catch (err) {
      updateUpload(filename, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const onPick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "photo" | "video",
  ) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    for (const f of files) {
      await uploadOne(f, kind);
    }
    await fetchList();
    // Через 3 секунды убираем завершённые из списка
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => !u.done && !u.error));
    }, 3000);
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      const r = await fetch(`${apiBase()}/api/admin/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kind: target.kind, key: target.key }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        alert(j.error ?? `Ошибка ${r.status}`);
        return;
      }
      await fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Сеть недоступна");
    }
  };

  const photoCount = items.filter((i) => i.kind === "photo").length;
  const videoCount = items.filter((i) => i.kind === "video").length;

  return (
    <div className="px-4 md:px-8 pt-8 md:pt-12 pb-24 max-w-[1400px] mx-auto">
      {/* Шапка */}
      <div className="flex items-end justify-between mb-8 md:mb-12 gap-6">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3">
            <span className="text-accent">/Admin</span> · Media
          </p>
          <h1 className="font-display font-medium tracking-[-0.03em] text-3xl md:text-5xl leading-none">
            Управление<span className="text-accent">.</span>
          </h1>
          <p className="mt-3 text-[11px] font-mono tracking-[0.12em] uppercase text-fg-faint">
            📷 {photoCount} · 🎥 {videoCount}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-[11px] font-mono tracking-[0.18em] uppercase text-fg-faint hover:text-fg transition-colors px-3 py-2"
        >
          Выйти ↗
        </button>
      </div>

      {/* Кнопки загрузки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => onPick(e, "photo")}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="group glass rounded-2xl px-6 py-6 md:py-8 flex flex-col items-start gap-2 hover:bg-accent/10 transition-colors text-left"
        >
          <span className="text-2xl">📷</span>
          <span className="font-display text-xl md:text-2xl">Загрузить фото</span>
          <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-fg-faint">
            jpg / png / webp · можно несколько
          </span>
        </button>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          multiple
          onChange={(e) => onPick(e, "video")}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="group glass rounded-2xl px-6 py-6 md:py-8 flex flex-col items-start gap-2 hover:bg-accent/10 transition-colors text-left"
        >
          <span className="text-2xl">🎥</span>
          <span className="font-display text-xl md:text-2xl">Загрузить видео</span>
          <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-fg-faint">
            mp4 / mov / webm · без лимита по размеру
          </span>
        </button>
      </div>

      {/* Активные загрузки */}
      {uploads.length > 0 ? (
        <div className="mb-8 flex flex-col gap-2">
          {uploads.map((u) => (
            <div
              key={u.filename}
              className="glass rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <span className="text-base">
                {u.kind === "photo" ? "📷" : "🎥"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[12px] truncate text-fg">
                  {u.filename}
                </div>
                <div className="mt-1 h-[3px] bg-bg-soft rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      u.error
                        ? "bg-red-500"
                        : u.done
                          ? "bg-green-500"
                          : "bg-accent"
                    }`}
                    style={{ width: `${Math.round(u.progress * 100)}%` }}
                  />
                </div>
                {u.error ? (
                  <div className="mt-1 text-[10px] font-mono text-red-500">
                    {u.error}
                  </div>
                ) : null}
              </div>
              <span className="text-[11px] font-mono text-fg-faint shrink-0">
                {u.error
                  ? "ошибка"
                  : u.done
                    ? "готово"
                    : `${Math.round(u.progress * 100)}%`}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Сетка медиа */}
      {loading ? (
        <div className="py-24 text-center font-mono text-sm text-fg-faint uppercase tracking-[0.18em]">
          Загрузка списка…
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-line">
          <p className="font-display text-2xl text-fg-muted">
            Пока пусто. Залей первое медиа кнопками выше.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {items.map((it) => (
            <MediaCard
              key={it.key}
              item={it}
              onDelete={() => setPendingDelete(it)}
            />
          ))}
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      {pendingDelete ? (
        <div
          className="fixed inset-0 z-[80] bg-bg/90 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setPendingDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-soft border border-line rounded-2xl p-6 max-w-md w-full"
          >
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3">
              {pendingDelete.kind === "photo" ? "📷" : "🎥"} Удалить?
            </p>
            <p className="font-mono text-sm text-fg break-all mb-6">
              {pendingDelete.key}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 glass rounded-full px-5 py-3 font-mono text-sm uppercase tracking-[0.14em] text-fg-muted hover:text-fg transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={doDelete}
                className="flex-1 rounded-full px-5 py-3 bg-red-500 text-white font-mono text-sm uppercase tracking-[0.14em] hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MediaCard({
  item,
  onDelete,
}: {
  item: MediaItem;
  onDelete: () => void;
}) {
  return (
    <div className="group relative bg-bg-soft aspect-[3/4] overflow-hidden">
      {item.kind === "photo" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          src={item.url}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Бэйдж типа */}
      <div className="absolute top-2 left-2 text-[9px] font-mono tracking-[0.18em] uppercase bg-bg/90 text-fg px-1.5 py-0.5 rounded">
        {item.kind === "photo" ? "FOTO" : "VIDEO"}
      </div>

      {/* Дата */}
      <div className="absolute bottom-2 left-2 text-[9px] font-mono uppercase tracking-[0.12em] text-white bg-black/60 px-1.5 py-0.5 rounded">
        {item.ago}
      </div>

      {/* Кнопка удаления */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="Удалить"
        className="absolute top-2 right-2 bg-bg/90 hover:bg-red-500 hover:text-white text-fg text-sm h-7 w-7 rounded flex items-center justify-center transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

function readImageDimensions(
  file: File,
): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function readVideoDimensions(
  file: File,
): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const w = v.videoWidth;
      const h = v.videoHeight;
      URL.revokeObjectURL(url);
      if (w && h) resolve({ w, h });
      else reject(new Error("no video dimensions"));
    };
    v.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    v.src = url;
  });
}
