import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { API } from "@/lib/config";

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: submit email + password ──────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Пароли не совпадают"); return; }
    if (password.length < 6) { setError("Минимум 6 символов"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Ошибка регистрации");
        return;
      }
      setStep(2);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: check if email is verified ───────────────────────────
  const handleCheckVerified = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/check-verified?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.isVerified) {
        navigate("/onboarding");
      } else {
        setError("Email ещё не подтверждён. Проверьте почту и перейдите по ссылке.");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">MBE</p>
          {step === 1 && (
            <>
              <h1 className="mt-3 text-3xl font-semibold text-white">Создайте аккаунт</h1>
              <p className="mt-2 text-sm text-white/60">Введите email и придумайте пароль.</p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="mt-3 text-3xl font-semibold text-white">Подтвердите email</h1>
              <p className="mt-2 text-sm text-white/60">Мы отправили письмо на{" "}<span className="text-white font-medium">{email}</span></p>
            </>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? "bg-white" : "bg-white/15"}`} />
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-white/60">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-white/60">Пароль</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-white/60">Повторите пароль</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" className={inputCls} />
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-3.5 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-60">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Отправляем письмо...</> : <>Далее <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-white/60" />
                  <p className="text-sm text-white/80">
                    Письмо отправлено на <strong className="text-white">{email}</strong>
                  </p>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Откройте письмо от MBE и нажмите кнопку <strong className="text-white/70">«Подтвердить email»</strong>. После этого вернитесь сюда.
                </p>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button onClick={handleCheckVerified} disabled={checking}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-3.5 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-60">
                {checking
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Проверяем...</>
                  : <><CheckCircle className="h-4 w-4" /> Я перешёл по ссылке — проверить статус</>}
              </button>

              <button onClick={() => setStep(1)} className="w-full text-sm text-white/40 hover:text-white/60 transition-colors">
                ← Изменить email
              </button>
            </div>
          )}
        </section>

        {step === 1 && (
          <p className="mt-6 text-center text-sm text-white/60">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">Войти</Link>
          </p>
        )}
        <p className="mt-4 text-center text-xs text-white/40">© {new Date().getFullYear()} MBE.</p>
      </div>
    </main>
  );
}
