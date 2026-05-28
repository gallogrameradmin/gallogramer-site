"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FillSubmit } from "./FillButton";
import ButtonAura from "./ButtonAura";
import DecorField from "./DecorField";
import EdgeMarks from "./EdgeMarks";

type Method = "telegram" | "email" | "phone" | "whatsapp";
type State = "idle" | "sending" | "ok" | "error";
type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "contact" | "message", string>
>;

const ease = [0.22, 1, 0.36, 1] as const;

const methods: { id: Method; label: string; placeholder: string }[] = [
  { id: "telegram", label: "Telegram", placeholder: "@username" },
  { id: "email", label: "Email", placeholder: "you@mail.com" },
  { id: "phone", label: "Телефон", placeholder: "+7 999 000 00 00" },
  { id: "whatsapp", label: "WhatsApp", placeholder: "+7 999 000 00 00" },
];

const REQUIRED_MSG = "Обязательное поле";

export default function RequestForm() {
  const [method, setMethod] = useState<Method>("telegram");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const currentMethod = methods.find((m) => m.id === method)!;

  function validate(payload: {
    firstName: string;
    lastName: string;
    contact: string;
    message: string;
  }): FieldErrors {
    const errors: FieldErrors = {};
    if (!payload.firstName.trim()) errors.firstName = REQUIRED_MSG;
    if (!payload.lastName.trim()) errors.lastName = REQUIRED_MSG;
    if (!payload.contact.trim()) errors.contact = REQUIRED_MSG;
    if (!payload.message.trim()) errors.message = REQUIRED_MSG;
    return errors;
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      firstName: String(fd.get("firstName") ?? ""),
      lastName: String(fd.get("lastName") ?? ""),
      contactMethod: method,
      contact: String(fd.get("contact") ?? ""),
      message: String(fd.get("message") ?? ""),
      honeypot: String(fd.get("website") ?? ""),
    };

    // Client-side validation
    const errors = validate(payload);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Прокручиваем к первому ошибочному полю
      const firstKey = Object.keys(errors)[0];
      const el = form.querySelector(
        `[name="${firstKey}"]`,
      ) as HTMLElement | null;
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setFieldErrors({});
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
      setMethod("telegram");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setState("error");
    }
  }

  // Базовый класс инпута + красная нижняя граница если есть ошибка
  const inputClass = (hasError: boolean) =>
    `w-full bg-transparent border-0 border-b py-3 text-base text-fg placeholder:text-fg-faint focus:outline-none transition-colors ${
      hasError
        ? "border-red-500 focus:border-red-500"
        : "border-line focus:border-accent"
    }`;

  const errorLabel = (msg?: string) =>
    msg ? (
      <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-red-500 mt-2">
        {msg}
      </span>
    ) : null;

  return (
    <section className="relative overflow-hidden px-6 md:px-12 pt-32 md:pt-40 pb-24 md:pb-32">
      {/* Декоративный фон */}
      <DecorField count={16} maxOpacity={0.12} />
      <EdgeMarks code="PAGE / R" label="REQUEST" />

      <div className="relative max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-12 md:mb-20"
        >
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-4 inline-flex items-center gap-2">
            <span className="text-accent">/Request</span>
            <span aria-hidden className="inline-block">
              <svg width="8" height="8" viewBox="0 0 10 10">
                <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.6" className="text-accent" />
                <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1.6" className="text-accent" />
              </svg>
            </span>
            <span>· Brief</span>
          </p>
          <h1 className="font-display font-medium tracking-[-0.04em] text-[clamp(2.5rem,8vw,7rem)] leading-[0.9]">
            Заявка<span className="text-accent">.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base md:text-lg text-fg-muted leading-relaxed">
            Расскажи о задаче — что снимаем, когда, где. Чем подробнее, тем точнее предложу формат и срок. Отвечаю в течение суток.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          noValidate
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.15 }}
          className="grid gap-10 md:gap-12"
        >
          {/* Имя + Фамилия */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
                01 / Имя*
              </span>
              <input
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Иван"
                aria-invalid={!!fieldErrors.firstName}
                onChange={() => clearFieldError("firstName")}
                className={inputClass(!!fieldErrors.firstName)}
              />
              {errorLabel(fieldErrors.firstName)}
            </label>
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
                02 / Фамилия*
              </span>
              <input
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Иванов"
                aria-invalid={!!fieldErrors.lastName}
                onChange={() => clearFieldError("lastName")}
                className={inputClass(!!fieldErrors.lastName)}
              />
              {errorLabel(fieldErrors.lastName)}
            </label>
          </div>

          {/* Способ связи */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-4 block">
              03 / Способ связи*
            </span>
            <div className="relative isolate flex flex-wrap gap-2 md:gap-3">
              <ButtonAura
                className="-inset-28 md:inset-auto md:top-[-9rem] md:bottom-[-6rem] md:left-[-8rem] md:right-auto md:w-[680px] md:h-[320px]"
                opacity={0.4}
                blur={80}
                shape="ellipse"
              />
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`px-4 py-2.5 rounded-full glass font-mono text-[11px] tracking-[0.18em] uppercase transition-colors ${
                    method === m.id
                      ? "glass-active text-accent"
                      : "text-fg-faint hover:text-fg"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Контакт */}
          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
              04 / Контакт ({currentMethod.label})*
            </span>
            <AnimatePresence mode="wait">
              <motion.input
                key={method}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease }}
                name="contact"
                type="text"
                inputMode={
                  method === "phone" || method === "whatsapp"
                    ? "tel"
                    : method === "email"
                      ? "email"
                      : "text"
                }
                placeholder={currentMethod.placeholder}
                aria-invalid={!!fieldErrors.contact}
                onChange={() => clearFieldError("contact")}
                className={inputClass(!!fieldErrors.contact)}
              />
            </AnimatePresence>
            {errorLabel(fieldErrors.contact)}
          </label>

          {/* Описание */}
          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-faint mb-2 block">
              05 / Что вам нужно*
            </span>
            <textarea
              name="message"
              rows={5}
              placeholder="Тип съёмки (репортаж/портрет/видео), даты, локация, бюджет, ссылка на референс…"
              aria-invalid={!!fieldErrors.message}
              onChange={() => clearFieldError("message")}
              className={`${inputClass(!!fieldErrors.message)} resize-none`}
            />
            {errorLabel(fieldErrors.message)}
          </label>

          {/* Honeypot */}
          <label
            aria-hidden="true"
            className="absolute -left-[9999px] w-px h-px overflow-hidden"
            tabIndex={-1}
          >
            <span>Website (не заполнять)</span>
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>

          <div className="relative isolate flex flex-col md:flex-row md:items-center gap-5 md:gap-8 pt-4 border-t border-line">
            <ButtonAura
              className="-inset-28 left-[-4rem] right-auto w-[640px] h-[320px] md:inset-auto md:top-[-8rem] md:bottom-[-4rem] md:w-[680px] md:h-[320px] md:left-[-9rem] md:right-auto"
              opacity={0.4}
              blur={80}
              shape="ellipse"
            />
            <FillSubmit disabled={state === "sending"}>
              <span className="relative">
                {state === "sending" ? "Отправляется…" : "Отправить заявку"}
              </span>
              <span
                aria-hidden
                className="relative inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </FillSubmit>

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
                  className="text-sm font-mono uppercase tracking-[0.12em] text-red-500"
                >
                  {error}
                </motion.p>
              )}
              {Object.keys(fieldErrors).length > 0 && state !== "ok" && (
                <motion.p
                  key="missing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease }}
                  className="text-sm font-mono uppercase tracking-[0.12em] text-red-500"
                >
                  Заполни обязательные поля
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
