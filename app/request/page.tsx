import type { Metadata } from "next";
import { Suspense } from "react";
import RequestForm from "../components/RequestForm";

export const metadata: Metadata = {
  title: "Заявка",
  description: "Отправить заявку на съёмку — Slava Bober",
};

export default function RequestPage() {
  return (
    <main>
      {/* RequestForm читает ?service=… через useSearchParams — в Next 16
          такие компоненты должны быть в Suspense boundary, иначе билд
          ругается на нестатичный рендер. Fallback пустой — форма короткая,
          мигание заметным не будет. */}
      <Suspense fallback={null}>
        <RequestForm />
      </Suspense>
    </main>
  );
}
