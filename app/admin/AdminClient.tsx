"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ContentEditor from "./ContentEditor";

type Tab = "media" | "content";

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

/**
 * Browser file.type иногда пустой или octet-stream (особенно из iOS Photos).
 * Доочинаем MIME по расширению — иначе S3 хранит видео как octet-stream
 * и стриминг ломается.
 */
function inferContentType(file: File): string {
  const t = file.type?.toLowerCase() ?? "";
  if (t && t !== "application/octet-stream") return t;
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "m4v":
      return "video/x-m4v";
    default:
      return "application/octet-stream";
  }
}

type MediaItem = {
  kind: "photo" | "video";
  key: string;
  url: string;
  mtimeMs: number;
  ago: string;
  /** Только для video — URL текущей обложки thumbs/<base>.jpg, если есть */
  thumbUrl?: string | null;
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
  const [tab, setTab] = useState<Tab>("media");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [posterTarget, setPosterTarget] = useState<MediaItem | null>(null);
  const [posterSaving, setPosterSaving] = useState(false);
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
    const contentType = inferContentType(file);
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
          contentType,
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
        xhr.setRequestHeader("Content-Type", contentType);
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

      // 3.5. Для видео — извлекаем первый кадр в JPEG и заливаем как thumbnail.
      // Иначе на мобильных preload=metadata режется и превью видео не показывается.
      if (kind === "video") {
        try {
          const thumbBlob = await generateVideoThumb(file);
          if (thumbBlob) {
            const thumbSign = await fetch(
              `${apiBase()}/api/admin/sign-thumb`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ videoKey: key }),
              },
            );
            if (thumbSign.ok) {
              const { url: thumbUrl } = (await thumbSign.json()) as {
                url: string;
              };
              await fetch(thumbUrl, {
                method: "PUT",
                body: thumbBlob,
                headers: { "Content-Type": "image/jpeg" },
              });
            }
          }
        } catch (err) {
          console.warn("[upload] thumb generation/upload failed:", err);
        }
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

  const setVideoPoster = async (
    video: MediaItem,
    photoKey: string | null,
  ) => {
    setPosterSaving(true);
    try {
      const r = await fetch(`${apiBase()}/api/admin/set-video-poster`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoKey: video.key,
          photoKey: photoKey ?? "",
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        alert(j.error ?? `Ошибка ${r.status}`);
        return;
      }
      await fetchList();
      setPosterTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Сеть недоступна");
    } finally {
      setPosterSaving(false);
    }
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
      <div className="flex items-end justify-between mb-6 md:mb-8 gap-6">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3">
            <span className="text-accent">/Admin</span> · {tab === "media" ? "Media" : "Content"}
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

      {/* Переключатель вкладок */}
      <div className="flex gap-1 mb-8 md:mb-10 border-b border-line">
        {(
          [
            { key: "media", label: "Медиа" },
            { key: "content", label: "Контент" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 md:px-5 py-2.5 text-[11px] font-mono tracking-[0.18em] uppercase transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "text-accent border-accent"
                : "text-fg-faint border-transparent hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент-редактор */}
      {tab === "content" ? (
        <ContentEditor token={token} apiBase={apiBase()} />
      ) : null}

      {tab !== "media" ? null : <>
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
              onPickPoster={
                it.kind === "video" ? () => setPosterTarget(it) : undefined
              }
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

      {/* Модалка выбора обложки для видео */}
      {posterTarget ? (
        <PosterPickerModal
          video={posterTarget}
          photos={items.filter((m) => m.kind === "photo")}
          saving={posterSaving}
          onClose={() => setPosterTarget(null)}
          onPick={(photoKey) => setVideoPoster(posterTarget, photoKey)}
        />
      ) : null}
      </>}
    </div>
  );
}

function MediaCard({
  item,
  onDelete,
  onPickPoster,
}: {
  item: MediaItem;
  onDelete: () => void;
  onPickPoster?: () => void;
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
      ) : item.thumbUrl ? (
        // Если у видео есть обложка — показываем её (быстрее, нагляднее).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbUrl}
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

      {/* Действия в правом верхнем углу */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Удалить"
          className="bg-bg/90 hover:bg-red-500 hover:text-white text-fg text-sm h-7 w-7 rounded flex items-center justify-center transition-colors"
        >
          ✕
        </button>
        {onPickPoster ? (
          <button
            type="button"
            onClick={onPickPoster}
            aria-label="Изменить обложку"
            title={item.thumbUrl ? "Сменить обложку" : "Назначить обложку"}
            className="bg-bg/90 hover:bg-accent hover:text-white text-fg text-xs h-7 w-7 rounded flex items-center justify-center transition-colors"
          >
            🖼
          </button>
        ) : null}
      </div>

      {/* Индикатор кастомной обложки */}
      {item.kind === "video" && item.thumbUrl ? (
        <div className="absolute bottom-2 right-2 text-[9px] font-mono tracking-[0.12em] uppercase bg-accent text-white px-1.5 py-0.5 rounded">
          poster
        </div>
      ) : null}
    </div>
  );
}

function PosterPickerModal({
  video,
  photos,
  saving,
  onClose,
  onPick,
}: {
  video: MediaItem;
  photos: MediaItem[];
  saving: boolean;
  onClose: () => void;
  onPick: (photoKey: string | null) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] bg-bg/90 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-soft border border-line rounded-2xl p-5 md:p-6 max-w-3xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-1">
              Обложка для видео
            </p>
            <p className="font-mono text-xs text-fg break-all">{video.key}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-faint hover:text-fg text-xl leading-none px-2"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] font-mono text-fg-faint mb-4">
          Выбери любое фото из галереи — оно станет постером в галерее
          портфолио и в лайтбоксе. Это перепишет авто-превью, если оно было.
        </p>

        {video.thumbUrl ? (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-fg-faint">
              Сейчас:
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbUrl}
              alt=""
              className="w-16 h-16 object-cover rounded border border-line"
            />
            <button
              type="button"
              onClick={() => onPick(null)}
              disabled={saving}
              className="ml-auto text-[11px] font-mono uppercase tracking-[0.14em] text-red-400 hover:text-red-300 px-3 py-2 transition-colors disabled:opacity-50"
            >
              Сбросить
            </button>
          </div>
        ) : null}

        <div className="overflow-y-auto flex-1 -mx-1 px-1">
          {photos.length === 0 ? (
            <div className="py-16 text-center font-mono text-sm text-fg-faint">
              В галерее ещё нет фото. Сначала загрузи фотографии.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onPick(p.key)}
                  disabled={saving}
                  className="group relative aspect-[3/4] bg-bg overflow-hidden border border-line hover:border-accent transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono uppercase tracking-[0.14em] text-white bg-accent px-2 py-1 rounded transition-opacity">
                      Выбрать
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {saving ? (
          <div className="mt-4 text-center text-[11px] font-mono uppercase tracking-[0.14em] text-fg-faint">
            Сохраняем обложку…
          </div>
        ) : null}
      </div>
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

/**
 * Извлекает кадр из видео через canvas и возвращает JPEG Blob.
 * Используется как thumbnail для превьюшек на портфолио (особенно на мобильных,
 * где preload="metadata" режется браузером и первый кадр не показывается).
 */
function generateVideoThumb(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    let resolved = false;
    const finish = (blob: Blob | null) => {
      if (resolved) return;
      resolved = true;
      try {
        URL.revokeObjectURL(url);
      } catch {}
      resolve(blob);
    };

    video.onloadedmetadata = () => {
      // Берём кадр на 1-й секунде или 10% длины — что меньше
      const target = Math.min(1, (video.duration || 1) * 0.1);
      try {
        video.currentTime = target;
      } catch {
        finish(null);
      }
    };

    video.onseeked = () => {
      try {
        const maxW = 1280;
        const scale = Math.min(1, maxW / (video.videoWidth || maxW));
        const w = Math.max(1, Math.round((video.videoWidth || 1280) * scale));
        const h = Math.max(1, Math.round((video.videoHeight || 720) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    };

    video.onerror = () => finish(null);
    // Защита от зависания
    setTimeout(() => finish(null), 20000);

    video.src = url;
  });
}
