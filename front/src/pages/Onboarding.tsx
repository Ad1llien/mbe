import { useOnboardingStore } from "@/stores/onboardingStore";
import { Step1 } from "@/components/onboarding/Step1";
import { Step2 } from "@/components/onboarding/Step2";
import { Step3 } from "@/components/onboarding/Step3";

export default function OnboardingPage() {
  const step = useOnboardingStore((s) => s.step);
  const total = 3;
  const progress = (step / total) * 100;

  return (
    <main className="min-h-screen bg-black">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8 sm:py-14">
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/60">
            <span>MBE</span>
            <span>Шаг {step} из {total}</span>
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