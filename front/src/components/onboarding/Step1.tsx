import { useEffect, useState } from "react";
import { Rocket, BarChart3, ShieldCheck, ArrowRight, Quote } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";

const QUOTES = [
  { text: "Не бойтесь конкуренции — бойтесь отсутствия системы.", author: "Стив Джобс" },
];
const FEATURES = [
  { Icon: Rocket, text: "Финансы, склад, CRM и задачи в реальном времени" },
  { Icon: BarChart3, text: "Аналитика и прогнозы для роста вашего дела" },
  { Icon: ShieldCheck, text: "Безопасные данные и роли для сотрудников" },
];

export function Step1() {
  const next = useOnboardingStore((s) => s.next);
  const [qIdx, setQIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQIdx((i) => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[qIdx];

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          MBE — Управляйте бизнесом в одной экосистеме
        </h1>
        <p className="text-sm text-white/60">Всё, что нужно вашей компании, — в одном окне.</p>
      </div>

      <ul className="space-y-3">
        {FEATURES.map(({ Icon, text }) => (
          <li key={text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Icon className="h-5 w-5 text-white" />
            </span>
            <span className="pt-2 text-sm text-white/90">{text}</span>
          </li>
        ))}
      </ul>

      <div key={qIdx} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <Quote className="mb-2 h-4 w-4 text-white/40" />
        <p className="text-sm italic text-white/80">«{q.text}»</p>
        <p className="mt-2 text-xs text-white/50">— {q.author}</p>
      </div>

      <button onClick={next}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-4 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black">
        Остаться с MBE
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}