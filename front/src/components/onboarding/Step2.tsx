import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, User, Phone } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";

const schema = z.object({
  fullName: z.string().trim().min(2, "Введите имя (мин. 2 символа)"),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Введите корректный номер").or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none transition-colors focus:border-white/40";

export function Step2() {
  const { user, setUser, next, prev } = useOnboardingStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: user.fullName ?? "", phone: user.phone ?? "" },
  });

  const onSubmit = (data: FormValues) => {
    setUser(data);
    next();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Расскажите о себе</h1>
        <p className="text-sm text-white/60">Как к вам обращаться?</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-white/60">Ваше имя</label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input {...register("fullName")} placeholder="Иван Иванов" className={inputCls} />
        </div>
        {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-white/60">
          Телефон <span className="normal-case text-white/30">(необязательно)</span>
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input type="tel" {...register("phone")} placeholder="+7 (777) 123-45-67" className={inputCls} />
        </div>
        {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={prev}
          className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>
        <button type="submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 py-3 text-sm font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black">
          Далее <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
