"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type State = "idle" | "sending" | "ok" | "error";

const ease = [0.22, 1, 0.36, 1] as const;

export default function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      contact: String(fd.get("contact") ?? ""),
      message: String(fd.get("message") ?? ""),
      honeypot: String(fd.get("website") ?? ""),
    };

    setState("sending");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Не удалось отправить.");
      }
      setState("ok");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setState("error");
    }
  }

  const inputClass =
    "w-full bg-transparent border-0 border-b border-line py-3 text-base text-fg placeholder:text-fg-faint focus:outline-none focus:border-fg transition-colors";

  return (
    <form onSubmit={handleSubmit} className="grid gap-7 md:gap-8" noValidate>
      <div className="grid md:grid-cols-2 gap-7 md:gap-8">
        <label className="block">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
            01 / Имя
          </span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Как тебя зовут"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
            02 / Контакт
          </span>
          <input
            name="contact"
            type="text"
            required
            placeholder="@telegram, email, телефон"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
          03 / Сообщение
        </span>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Тип съёмки, даты, формат, ссылка на референс"
          className={`${inputClass} resize-none`}
        />
      </label>

      {/* Honeypot — скрытое поле, спам-боты обычно заполняют всё */}
      <label
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
        tabIndex={-1}
      >
        <span>Website (не заполнять)</span>
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </label>

      <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8 pt-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="group inline-flex items-center justify-center gap-3 bg-fg text-bg font-mono uppercase tracking-[0.14em] text-sm px-7 py-4 hover:bg-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>
            {state === "sending" ? "Отправляется…" : "Отправить заявку"}
          </span>
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </button>

        <AnimatePresence mode="wait">
          {state === "ok" && (
            <motion.p
              key="ok"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease }}
              className="text-sm font-mono uppercase tracking-[0.12em] text-fg"
            >
              <span className="text-accent">●</span> Принято. Отвечу в течение суток.
            </motion.p>
          )}
          {state === "error" && (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease }}
              className="text-sm font-mono uppercase tracking-[0.12em] text-accent"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
