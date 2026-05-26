import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Package, Handshake, CheckSquare, Check, Building2, User } from "lucide-react";
import { useOnboardingStore, type ModuleKey, type LegalStatus } from "@/stores/onboardingStore";

const INDUSTRIES = ["Розничная торговля", "Услуги", "Производство", "IT / Аутсорсинг", "Другое"];
const TEAM_SIZES = ["1-2", "3-10", "11-50", "50+"];
const MODULES: { key: ModuleKey; title: string; description: string; Icon: typeof Wallet }[] = [
  { key: "finance", title: "Финансы", description: "Доходы, расходы, отчеты", Icon: Wallet },
  { key: "warehouse", title: "Склад", description: "Остатки, заказы поставщикам", Icon: Package },
  { key: "crm", title: "CRM", description: "Клиенты, сделки, воронка", Icon: Handshake },
  { key: "tasks", title: "Список задач", description: "Дедлайны, календарь, напоминания", Icon: CheckSquare },
];

const schema = z.object({
  industry: z.string().min(1, "Выберите отрасль"),
  teamSize: z.string().min(1, "Выберите размер команды"),
  legalStatus: z.enum(["TOO", "IP"], { errorMap: () => ({ message: "Выберите статус" }) }),
  selectedModules: z.array(z.enum(["finance", "warehouse", "crm", "tasks"])).min(1, "Выберите хотя бы один модуль"),
});
type FormValues = z.infer<typeof schema>;

export function Step3() {
  const { company, selectedModules, setCompany, setModules, prev, user, reset } = useOnboardingStore();
  const navigate = useNavigate();

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      industry: company.industry, teamSize: company.teamSize,
      legalStatus: (company.legalStatus || undefined) as LegalStatus | undefined,
      selectedModules,
    },
  });

  const modules = watch("selectedModules") || [];

  const toggleModule = (key: ModuleKey) => {
    const next = modules.includes(key) ? modules.filter((m) => m !== key) : [...modules, key];
    setValue("selectedModules", next, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setCompany({ industry: data.industry, teamSize: data.teamSize, legalStatus: data.legalStatus });
    setModules(data.selectedModules);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem("mbe-registration", JSON.stringify({ user: { email: user.email }, company: data, completedAt: new Date().toISOString() }));
    reset();
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Расскажите о компании</h1>
        <p className="text-sm text-white/60">Настроим MBE под ваш бизнес.</p>
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60">
          <Building2 className="h-3.5 w-3.5" /> Чем занимается компания?
        </label>
        <select {...register("industry")}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-white/40">
          <option value="" className="bg-black">Выберите отрасль</option>
          {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-black">{i}</option>)}
        </select>
        {errors.industry && <p className="text-xs text-red-400">{errors.industry.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/60">
          <User className="h-3.5 w-3.5" /> Сколько человек работает?
        </label>
        <Controller name="teamSize" control={control} render={({ field }) => (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TEAM_SIZES.map((size) => (
              <button type="button" key={size} onClick={() => field.onChange(size)}
                className={`rounded-xl border px-3 py-3 text-sm transition-all ${field.value === size ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/80 hover:border-white/40"}`}>
                {size}
              </button>
            ))}
          </div>
        )} />
        {errors.teamSize && <p className="text-xs text-red-400">{errors.teamSize.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-white/60">Юридический статус</label>
        <Controller name="legalStatus" control={control} render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            {(["TOO", "IP"] as LegalStatus[]).map((s) => (
              <button type="button" key={s} onClick={() => field.onChange(s)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${field.value === s ? "border-white bg-white text-black" : "border-white/10 bg-white/5 text-white/80 hover:border-white/40"}`}>
                {s === "TOO" ? "ТОО" : "ИП"}
              </button>
            ))}
          </div>
        )} />
        {errors.legalStatus && <p className="text-xs text-red-400">{errors.legalStatus.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-white/60">Функции MBE — выберите модули</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULES.map(({ key, title, description, Icon }) => {
            const active = modules.includes(key);
            return (
              <button type="button" key={key} onClick={() => toggleModule(key)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left backdrop-blur-md transition-all ${active ? "border-white bg-white/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="font-medium text-white">{title}</span>
                <span className="text-xs text-white/60">{description}</span>
              </button>
            );
          })}
        </div>
        {errors.selectedModules && <p className="text-xs text-red-400">{errors.selectedModules.message as string}</p>}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={prev}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>
        <button type="submit" disabled={isSubmitting}
          className="rounded-xl border border-white/40 bg-transparent px-6 py-3 text-sm font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black disabled:opacity-60 sm:flex-1">
          {isSubmitting ? "Сохраняем..." : "Завершить регистрацию"}
        </button>
      </div>
    </form>
  );
}