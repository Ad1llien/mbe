import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MessageCircle, Mail, Lock, Building2, Phone } from "lucide-react";
import { useOnboardingStore, type DeliveryMethod } from "@/stores/onboardingStore";

const schema = z.object({
  companyName: z.string().trim().min(2, "Введите название (мин. 2 символа)").max(100),
  email: z.string().trim().email("Введите корректный email").max(255),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{10,20}$/, "Введите корректный номер телефона"),
  password: z.string().min(6, "Минимум 6 символов").max(72),
  deliveryMethod: z.enum(["email", "whatsapp"]),
});
type FormValues = z.infer<typeof schema>;

export function Step2() {
  const { user, setUser, next, prev } = useOnboardingStore();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submittedMethod, setSubmittedMethod] = useState<DeliveryMethod>("whatsapp");

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: user.companyName, email: user.email,
      phone: user.phone, password: user.password,
      deliveryMethod: user.deliveryMethod || "whatsapp",
    },
  });

  const onSubmit = (data: FormValues) => {
    setUser(data);
    setSubmittedMethod(data.deliveryMethod);
    setOpen(true);
  };

  const verify = () => {
    setChecking(true);
    setTimeout(() => { setChecking(false); setOpen(false); next(); }, 2000);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Регистрация компании</h1>
        <p className="text-sm text-white/60">Укажите данные юр. лица — мы отправим код подтверждения.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-white/60">Название юр. лица (ТОО / ИП)</label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input {...register("companyName")} placeholder='ТОО "Моя Компания"'
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40" />
          </div>
          {errors.companyName && <p className="text-xs text-red-400">{errors.companyName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-white/60">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input type="email" autoComplete="email" {...register("email")} placeholder="you@company.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40" />
          </div>
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-white/60">Номер телефона</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input type="tel" autoComplete="tel" {...register("phone")} placeholder="+7 (777) 123-45-67"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40" />
          </div>
          {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-white/60">Пароль</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input type="password" autoComplete="new-password" {...register("password")} placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40" />
          </div>
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-white/60">Куда отправить код подтверждения?</label>
          <Controller name="deliveryMethod" control={control} render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              {([{ key: "whatsapp", label: "WhatsApp", Icon: MessageCircle }, { key: "email", label: "Email", Icon: Mail }] as { key: DeliveryMethod; label: string; Icon: typeof Mail }[]).map(({ key, label, Icon }) => (
                <button type="button" key={key} onClick={() => field.onChange(key)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${field.value === key ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/80 hover:border-white/40"}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
          )} />
        </div>

        <button type="submit"
          className="w-full rounded-xl border border-white/40 bg-transparent px-6 py-3.5 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black">
          Зарегистрироваться
        </button>

        <div className="flex items-center justify-between">
          <button type="button" onClick={prev} className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>
          <button type="button" onClick={() => showToast("Ссылка для сброса отправлена")}
            className="text-sm text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline">
            Забыли пароль?
          </button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-xl">
          {toast}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                {submittedMethod === "whatsapp" ? <MessageCircle className="h-6 w-6 text-white" /> : <Mail className="h-6 w-6 text-white" />}
              </div>
              <h2 className="text-lg font-semibold text-white">
                Подтверждение через {submittedMethod === "whatsapp" ? "WhatsApp" : "Email"}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              {submittedMethod === "whatsapp"
                ? "Ссылка для входа отправлена на ваш номер WhatsApp. Перейдите по ней и вернитесь сюда."
                : "Ссылка для входа отправлена на вашу почту. Перейдите по ней и вернитесь сюда."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => setOpen(false)} disabled={checking}
                className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50">
                Отмена
              </button>
              <button onClick={verify} disabled={checking}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-4 py-3 text-sm font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-60">
                {checking ? <><Loader2 className="h-4 w-4 animate-spin" /> Проверяем...</> : "Я перешел, проверить статус"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}