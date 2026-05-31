"use client";

import { motion } from "framer-motion";
import { FillLink } from "./FillButton";
import ButtonAura from "./ButtonAura";
import DecorField from "./DecorField";
import EdgeMarks from "./EdgeMarks";
import type { SocialLink } from "@/app/lib/content-source";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Footer({ socials = [] }: { socials?: SocialLink[] }) {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden px-6 md:px-12 pt-20 md:pt-32 pb-10 md:pb-12 border-t border-line"
    >
      {/* Декоративный фон */}
      <DecorField count={18} maxOpacity={0.15} />
      <EdgeMarks code="005 / D" label="CONTACT" />

      <div className="relative max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease }}
          className="mb-16 md:mb-24 grid lg:grid-cols-12 gap-10 lg:gap-12 items-end"
        >
          <div className="lg:col-span-6">
            <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-6 inline-flex items-center gap-2">
              <span className="text-accent">005</span>
              <span aria-hidden className="inline-block">
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <polygon points="5,0.6 9.4,5 5,9.4 0.6,5" className="fill-accent" />
                </svg>
              </span>
              <span>/ Contact</span>
            </p>
            <p className="font-display font-medium tracking-[-0.03em] text-[clamp(2rem,7vw,6rem)] leading-[0.95]">
              Связаться<span className="text-accent">.</span>
            </p>
          </div>

          <div className="relative isolate lg:col-span-5 lg:col-start-8 flex flex-col gap-3 md:gap-4">
            <ButtonAura className="-inset-12" opacity={0.55} />
            <FillLink href="/request">
              <span className="relative">Отправить заявку</span>
              <span
                aria-hidden
                className="relative inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </FillLink>

            <FillLink href="https://t.me/gallogramer_bot" external>
              <span className="relative">Telegram bot</span>
              <span
                aria-hidden
                className="relative inline-block transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </FillLink>

            {socials.length > 0 ? (
              <div className="pt-5 mt-2 border-t border-line">
                <p className="text-[10px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-3">
                  Соцсети
                </p>
                <div className="flex flex-col gap-2">
                  {socials.map((s) => (
                    <a
                      key={`${s.label}-${s.url}`}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.14em] text-fg hover:text-accent transition-colors w-fit"
                    >
                      <span
                        aria-hidden
                        className="inline-block h-[6px] w-[6px] rounded-full bg-accent"
                      />
                      {s.label}
                      <span aria-hidden>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-line text-[11px] tracking-[0.12em] uppercase font-mono text-fg-faint">
          <div>
            <div className="text-fg-faint/60 mb-1">[ project ]</div>
            <div className="text-fg">gallogramer.com</div>
          </div>
          <div>
            <div className="text-fg-faint/60 mb-1">[ author ]</div>
            <div className="text-fg">Slava Bober</div>
          </div>
          <div>
            <div className="text-fg-faint/60 mb-1">[ year ]</div>
            <div className="text-fg">© {new Date().getFullYear()}</div>
          </div>
          <div>
            <div className="text-fg-faint/60 mb-1">[ build ]</div>
            <div className="text-fg">v10.12</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
