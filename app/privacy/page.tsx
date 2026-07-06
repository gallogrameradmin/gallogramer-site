import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";
import { getContent } from "../lib/content-source";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика обработки персональных данных на gallogramer.com — в соответствии с ФЗ-152.",
};

export const revalidate = 60;

export default async function PrivacyPage() {
  const content = await getContent();
  const { ownerName, ownerInn, ownerEmail, privacyUpdatedAt } = content.legal;

  const updated = new Date(privacyUpdatedAt);
  const updatedHuman = isNaN(updated.getTime())
    ? privacyUpdatedAt
    : updated.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  return (
    <>
      <main className="px-6 md:px-12 pt-32 md:pt-40 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.18em] uppercase font-mono text-fg-faint mb-4 inline-flex items-center gap-2">
            <span className="text-accent">Legal</span>
            <span aria-hidden className="inline-block">
              <svg width="8" height="8" viewBox="0 0 10 10">
                <polygon
                  points="5,0.6 9.4,5 5,9.4 0.6,5"
                  className="fill-accent"
                />
              </svg>
            </span>
            <span>/ Privacy</span>
          </p>
          <h1 className="font-display font-medium tracking-[-0.04em] text-[clamp(2rem,6vw,4.5rem)] leading-[0.95] mb-3">
            Политика конфиденциальности<span className="text-accent">.</span>
          </h1>
          <p className="text-[11px] tracking-[0.14em] uppercase font-mono text-fg-faint mb-12">
            Редакция от {updatedHuman}
          </p>

          <div className="flex flex-col gap-10 text-fg-muted text-[15px] md:text-base leading-relaxed">
            <Section title="1. Общие положения">
              <p>
                Настоящая Политика описывает, как оператор персональных данных
                — самозанятое физическое лицо{" "}
                <strong className="text-fg">{ownerName}</strong> (ИНН{" "}
                <span className="font-mono">{ownerInn}</span>), далее — «Оператор»,
                — обрабатывает персональные данные пользователей сайта{" "}
                <strong className="text-fg">gallogramer.com</strong>. Политика
                разработана в соответствии с Федеральным законом от 27.07.2006
                № 152-ФЗ «О персональных данных».
              </p>
              <p className="mt-3">
                Использование сайта и отправка заявки означают согласие
                пользователя с условиями настоящей Политики. Если пользователь
                не согласен — он должен прекратить использование сайта.
              </p>
            </Section>

            <Section title="2. Какие данные обрабатываются">
              <p>Оператор собирает и обрабатывает следующие данные:</p>
              <ul className="mt-3 flex flex-col gap-1.5 list-disc list-inside marker:text-accent">
                <li>
                  <span className="text-fg">Имя и фамилия</span> — из полей
                  формы заявки на сайте.
                </li>
                <li>
                  <span className="text-fg">Контактные данные</span> —
                  идентификатор Telegram, email-адрес, номер телефона или
                  WhatsApp — на выбор пользователя.
                </li>
                <li>
                  <span className="text-fg">Текст сообщения</span> — свободный
                  текст с описанием задачи (тип съёмки, даты, бюджет и т.п.).
                </li>
                <li>
                  <span className="text-fg">Технические данные</span> —
                  IP-адрес, тип браузера и устройства, страницы, которые
                  просматривал пользователь (собираются автоматически
                  веб-хостингом и системами аналитики).
                </li>
              </ul>
              <p className="mt-3">
                Оператор не собирает данные, относящиеся к специальным
                категориям (расовая принадлежность, политические взгляды,
                состояние здоровья и т.п.), а также биометрические данные.
              </p>
            </Section>

            <Section title="3. Цели обработки">
              <ul className="flex flex-col gap-1.5 list-disc list-inside marker:text-accent">
                <li>
                  Обработка заявок на услуги фото- и видеосъёмки: связь с
                  пользователем, уточнение деталей заказа, согласование условий.
                </li>
                <li>
                  Оказание услуг и выполнение обязательств перед пользователем.
                </li>
                <li>
                  Улучшение работы сайта (агрегированная веб-аналитика без
                  идентификации конкретных пользователей).
                </li>
              </ul>
            </Section>

            <Section title="4. Правовые основания">
              <p>
                Обработка данных ведётся на основании согласия пользователя,
                которое он даёт при отправке формы заявки, а также на
                основании статьи 6 ФЗ-152 — для исполнения договора возмездного
                оказания услуг между Оператором и пользователем.
              </p>
            </Section>

            <Section title="5. Как и где хранятся данные">
              <p>
                Персональные данные пользователей сайта хранятся на серверах
                Yandex Object Storage в регионе <em>ru-central1</em>{" "}
                (Российская Федерация). Оператор реализует организационные и
                технические меры для защиты данных от неправомерного доступа,
                уничтожения и распространения — доступ ограничен по shared
                secret, транспорт зашифрован (HTTPS/TLS).
              </p>
              <p className="mt-3">
                Уведомления о новых заявках дополнительно передаются в
                мессенджер Telegram (оператор Telegram FZ-LLC, ОАЭ) — это
                трансграничная передача данных, необходимая для оперативной
                связи с пользователем. Отправляя заявку, пользователь даёт
                согласие на такую передачу.
              </p>
            </Section>

            <Section title="6. Сроки хранения">
              <p>
                Данные хранятся до достижения цели обработки: до момента
                исполнения услуги, но не менее 3 лет с момента последнего
                контакта — на случай возможных претензий и налогового учёта
                (пп. 8 п. 1 ст. 23 НК РФ). По истечении срока данные
                уничтожаются.
              </p>
            </Section>

            <Section title="7. Права пользователя">
              <ul className="flex flex-col gap-1.5 list-disc list-inside marker:text-accent">
                <li>
                  Получить подтверждение факта обработки, а также сведения о
                  целях, сроках и способах обработки.
                </li>
                <li>
                  Требовать уточнения, блокирования или уничтожения данных,
                  если они неполны, устарели, недостоверны или незаконно
                  получены.
                </li>
                <li>
                  Отозвать согласие на обработку данных в любой момент.
                </li>
                <li>
                  Обжаловать действия Оператора в Роскомнадзор или в суд.
                </li>
              </ul>
              <p className="mt-3">
                Для реализации любого права свяжитесь с Оператором по адресу{" "}
                <a
                  href={`mailto:${ownerEmail}`}
                  className="text-accent underline underline-offset-4 hover:no-underline"
                >
                  {ownerEmail}
                </a>
                . Оператор рассматривает обращение в течение 30 дней.
              </p>
            </Section>

            <Section title="8. Cookie-файлы и аналитика">
              <p>
                Сайт может использовать cookie-файлы и системы веб-аналитики
                (например, Яндекс.Метрика) для сбора обезличенной статистики
                посещений. Пользователь может отключить cookie в настройках
                браузера; часть функциональности сайта при этом может
                перестать работать корректно.
              </p>
            </Section>

            <Section title="9. Изменения политики">
              <p>
                Оператор оставляет за собой право изменять настоящую Политику.
                Актуальная редакция всегда доступна по адресу{" "}
                <span className="font-mono text-fg">
                  gallogramer.com/privacy
                </span>
                . Дата последней редакции — {updatedHuman}.
              </p>
            </Section>

            <Section title="10. Контакты">
              <p>По вопросам обработки персональных данных:</p>
              <ul className="mt-3 flex flex-col gap-1.5 list-disc list-inside marker:text-accent">
                <li>
                  Оператор: <span className="text-fg">{ownerName}</span>
                </li>
                <li>
                  ИНН: <span className="font-mono text-fg">{ownerInn}</span>
                </li>
                <li>
                  Email:{" "}
                  <a
                    href={`mailto:${ownerEmail}`}
                    className="text-accent underline underline-offset-4 hover:no-underline"
                  >
                    {ownerEmail}
                  </a>
                </li>
              </ul>
            </Section>
          </div>

          <div className="mt-16 pt-6 border-t border-line">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-fg-faint hover:text-accent transition-colors"
            >
              <span aria-hidden>←</span>
              <span>На главную</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer socials={content.socials} />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display font-medium text-xl md:text-2xl tracking-[-0.02em] text-fg mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
