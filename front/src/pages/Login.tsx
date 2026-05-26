import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const ok = await login(data.email, data.password);
    setLoading(false);
    if (ok) {
      setToast("Вход выполнен");
      setTimeout(() => navigate("/"), 600);
    } else {
      setToast("Неверный email или пароль");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">MBE</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">С возвращением</h1>
          <p className="mt-2 text-sm text-white/60">Войдите, чтобы продолжить управлять бизнесом.</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-white/60">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input type="email" autoComplete="email" {...register("email")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
                  placeholder="you@company.com" />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-white/60">Пароль</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input type="password" autoComplete="current-password" {...register("password")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40"
                  placeholder="••••••••" />
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-3.5 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Входим...</> : <>Войти <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-white/40">или</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-white/60">
            Нет аккаунта?{" "}
            <Link to="/onboarding" className="font-medium text-white underline-offset-4 hover:underline">Зарегистрироваться</Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-white/40">© {new Date().getFullYear()} MBE. Управляйте бизнесом красиво.</p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-xl">
          {toast}
        </div>
      )}
    </main>
  );
}