import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStore, SESSION_DURATION } from "@/stores/onboardingStore";
import { Step1 } from "@/components/onboarding/Step1";
import { Step2 } from "@/components/onboarding/Step2";
import { Step3 } from "@/components/onboarding/Step3";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { step, verifiedAt, isSessionExpired, reset } = useOnboardingStore();
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_DURATION);

  // Guard: if no verifiedAt or session expired → back to register
  useEffect(() => {
    if (!verifiedAt || isSessionExpired()) {
      reset();
      navigate("/register", { replace: true });
      return;
    }

    // Countdown timer
    const tick = () => {
      const remaining = SESSION_DURATION - (Date.now() - verifiedAt);
      if (remaining <= 0) {
        setSessionExpiredMsg(true);
        reset();
        setTimeout(() => navigate("/register", { replace: true }), 2500);
      } else {
        setTimeLeft(remaining);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [verifiedAt]);

  const total = 3;
  const progress = (step / total) * 100;

  const mm = String(Math.floor(timeLeft / 60000)).padStart(2, "0");
  const ss = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0");
  const isWarning = timeLeft < 3 * 60 * 1000; // red when < 3 min

  if (sessionExpiredMsg) {
    return (
      <main className="relative min-h-screen bg-black flex items-center justify-center px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">MBE</p>
          <h1 className="text-2xl font-semibold text-white">Сессия истекла</h1>
          <p className="text-sm text-white/60">Время на завершение регистрации вышло.<br />Пожалуйста, начните заново.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8 sm:py-14">

        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/60">
            <span>MBE</span>
            <div className="flex items-center gap-3">
              {/* Session countdown */}
              <span className={`font-mono text-xs ${isWarning ? "text-red-400 animate-pulse" : "text-white/40"}`}>
                {isWarning ? "⚠ " : ""}сессия {mm}:{ss}
              </span>
              <span>Шаг {step} из {total}</span>
            </div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </section>

        <p className="mt-6 text-center text-xs text-white/40">© {new Date().getFullYear()} MBE. Управляйте бизнесом красиво.</p>
      </div>
    </main>
  );
}
