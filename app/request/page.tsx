import type { Metadata } from "next";
import RequestForm from "../components/RequestForm";

export const metadata: Metadata = {
  title: "Заявка",
  description: "Отправить заявку на съёмку — Slava Bober",
};

export default function RequestPage() {
  return (
    <main>
      <RequestForm />
    </main>
  );
}
