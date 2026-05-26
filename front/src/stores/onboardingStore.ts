import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LegalStatus = "TOO" | "IP";
export type ModuleKey = "finance" | "warehouse" | "crm" | "tasks";
export type DeliveryMethod = "email" | "whatsapp";

export interface UserData {
  email: string;
  password: string;
  companyName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
}

export interface CompanyData {
  industry: string;
  teamSize: string;
  legalStatus: LegalStatus | "";
}

interface OnboardingState {
  step: 1 | 2 | 3;
  user: UserData;
  company: CompanyData;
  selectedModules: ModuleKey[];
  setStep: (step: 1 | 2 | 3) => void;
  next: () => void;
  prev: () => void;
  setUser: (u: Partial<UserData>) => void;
  setCompany: (c: Partial<CompanyData>) => void;
  toggleModule: (m: ModuleKey) => void;
  setModules: (m: ModuleKey[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      user: { email: "", password: "", companyName: "", phone: "", deliveryMethod: "whatsapp" },
      company: { industry: "", teamSize: "", legalStatus: "" },
      selectedModules: [],
      setStep: (step) => set({ step }),
      next: () => {
        const s = get().step;
        if (s < 3) set({ step: (s + 1) as 1 | 2 | 3 });
      },
      prev: () => {
        const s = get().step;
        if (s > 1) set({ step: (s - 1) as 1 | 2 | 3 });
      },
      setUser: (u) => set({ user: { ...get().user, ...u } }),
      setCompany: (c) => set({ company: { ...get().company, ...c } }),
      toggleModule: (m) => {
        const cur = get().selectedModules;
        set({ selectedModules: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] });
      },
      setModules: (m) => set({ selectedModules: m }),
      reset: () =>
        set({
          step: 1,
          user: { email: "", password: "", companyName: "", phone: "", deliveryMethod: "whatsapp" },
          company: { industry: "", teamSize: "", legalStatus: "" },
          selectedModules: [],
        }),
    }),
    { name: "mbe-onboarding" }
  )
);