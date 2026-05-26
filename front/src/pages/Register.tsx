import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Loader2, ArrowRight, Building2, Phone, MessageCircle, User as UserIcon } from "lucide-react";

const schema = z.object({
  fullName: z.string().trim().min(2, "Введите ваше имя"),
  companyName: z.string().trim().min(2, "Укажите название компании"),
  email: z.string().trim().email("Введите корректный email"),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{10,20}$/, "Введите корректный номер телефона"),
  password: z.string().min(6, "Минимум 6 символов"),
  confirm: z.string().min(6, "Подтвердите пароль"),
  deliveryMethod: z.enum(["email", "whatsapp"]),
  agree: z.literal(true, { errorMap: () => ({ message: "Необходимо согласие" }) }),
}).refine((d) => d.password === d.confirm, { message: "Пароли не совпадают", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;
type Delivery = "email" | "whatsapp";

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40";

function Field({ label, error, icon: Icon, children }: { label: string; error?: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-white/60">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        {children}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", companyName: "", email: "", phone: "", password: "", confirm: "", deliveryMethod: "whatsapp", agree: false as unknown as true },
  });

  const onSubmit = (data: FormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast(data.deliveryMethod === "whatsapp" ? "Код отправлен в WhatsApp" : "Код отправлен на Email");
      setTimeout(() => navigate("/onboarding"), 800);
    }, 1200);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">MBE</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Создайте аккаунт</h1>
          <p className="mt-2 text-sm text-white/60">Несколько данных — и вы внутри экосистемы MBE.</p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Ваше имя" error={errors.fullName?.message} icon={UserIcon}>
              <input {...register("fullName")} placeholder="Иван Иванов" className={inputCls} />
            </Field>
            <Field label="Название юр. лица (ТОО / ИП)" error={errors.companyName?.message} icon={Building2}>
              <input {...register("companyName")} placeholder='ТОО "Моя Компания"' className={inputCls} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email?.message} icon={Mail}>
                <input type="email" autoComplete="email" {...register("email")} placeholder="you@company.com" className={inputCls} />
              </Field>
              <Field label="Телефон" error={errors.phone?.message} icon={Phone}>
                <input type="tel" autoComplete="tel" {...register("phone")} placeholder="+7 (777) 123-45-67" className={inputCls} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Пароль" error={errors.password?.message} icon={Lock}>
                <input type="password" autoComplete="new-password" {...register("password")} placeholder="••••••••" className={inputCls} />
              </Field>
              <Field label="Повторите пароль" error={errors.confirm?.message} icon={Lock}>
                <input type="password" autoComplete="new-password" {...register("confirm")} placeholder="••••••••" className={inputCls} />
              </Field>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/60">Куда отправить код подтверждения?</label>
              <Controller name="deliveryMethod" control={control} render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {([{ key: "whatsapp", label: "WhatsApp", Icon: MessageCircle }, { key: "email", label: "Email", Icon: Mail }] as { key: Delivery; label: string; Icon: typeof Mail }[]).map(({ key, label, Icon }) => (
                    <button type="button" key={key} onClick={() => field.onChange(key)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${field.value === key ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/80 hover:border-white/40"}`}>
                      <Icon className="h-4 w-4" />{label}
                    </button>
                  ))}
                </div>
              )} />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 transition-colors hover:border-white/20">
              <input type="checkbox" {...register("agree")} className="mt-0.5 h-4 w-4 accent-white" />
              <span>Я принимаю условия использования и политику конфиденциальности MBE.</span>
            </label>
            {errors.agree && <p className="text-xs text-red-400">{errors.agree.message}</p>}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-3.5 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Создаём аккаунт...</> : <>Зарегистрироваться <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-white/40">или</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-white/60">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">Войти</Link>
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