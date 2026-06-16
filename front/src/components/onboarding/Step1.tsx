import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";

const OPTIONS = [
  { id: "instagram", label: "Instagram / Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google / Поиск" },
  { id: "friend", label: "Рекомендация друга или коллеги" },
  { id: "telegram", label: "Telegram канал / чат" },
  { id: "event", label: "Мероприятие / конференция" },
  { id: "other", label: "Другое" },
];

export function Step1() {
  const next = useOnboardingStore((s) => s.next);
  const setUser = useOnboardingStore((s) => s.setUser);
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (!selected) return;
    setUser({ source: selected } as any);
    next();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Шаг 1 из 3</p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Откуда вы узнали про MBE?</h1>
        <p className="text-sm text-white/50">Поможет нам стать лучше.</p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(id)}
            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium text-left transition-all ${
              selected === id
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10"
            }`}
          >
            <span className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
              selected === id ? "border-black" : "border-white/30"
            }`}>
              {selected === id && <span className="h-2 w-2 rounded-full bg-black" />}
            </span>
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!selected}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-4 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Далее
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
