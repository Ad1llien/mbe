import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LegalStatus = "TOO" | "IP";
export type ModuleKey = "finance" | "warehouse" | "crm" | "tasks";
export type DeliveryMethod = "email" | "whatsapp"; // kept for compat

export interface UserData {
  fullName: string;
  phone: string;
  // legacy (kept so old Step2 refs don't crash if any remain)
  email?: string;
  password?: string;
  companyName?: string;
  deliveryMethod?: DeliveryMethod;
}

export interface CompanyData {
  companyName: string;
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

const defaultUser: UserData = { fullName: "", phone: "" };
const defaultCompany: CompanyData = { companyName: "", industry: "", teamSize: "", legalStatus: "" };

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 1,
      user: defaultUser,
      company: defaultCompany,
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
      reset: () => set({ step: 1, user: defaultUser, company: defaultCompany, selectedModules: [] }),
    }),
    { name: "mbe-onboarding" }
  )
);
