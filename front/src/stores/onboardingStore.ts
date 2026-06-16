import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LegalStatus = "TOO" | "IP";
export type ModuleKey = "finance" | "warehouse" | "crm" | "tasks";
export type DeliveryMethod = "email" | "whatsapp";

export interface UserData {
  fullName: string;
  phone: string;
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

const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes in ms

interface OnboardingState {
  step: 1 | 2 | 3;
  user: UserData;
  company: CompanyData;
  selectedModules: ModuleKey[];
  verifiedAt: number | null;   // timestamp when email was verified
  isComplete: boolean;          // onboarding fully finished

  setStep: (step: 1 | 2 | 3) => void;
  next: () => void;
  prev: () => void;
  setUser: (u: Partial<UserData>) => void;
  setCompany: (c: Partial<CompanyData>) => void;
  toggleModule: (m: ModuleKey) => void;
  setModules: (m: ModuleKey[]) => void;
  setVerifiedAt: (ts: number) => void;
  setComplete: () => void;
  isSessionExpired: () => boolean;
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
      verifiedAt: null,
      isComplete: false,

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
      setVerifiedAt: (ts) => set({ verifiedAt: ts }),
      setComplete: () => set({ isComplete: true }),
      isSessionExpired: () => {
        const { verifiedAt } = get();
        if (!verifiedAt) return true;
        return Date.now() - verifiedAt > SESSION_DURATION;
      },
      reset: () => set({
        step: 1,
        user: defaultUser,
        company: defaultCompany,
        selectedModules: [],
        verifiedAt: null,
        // isComplete intentionally NOT reset — if finished once, stays finished
      }),
    }),
    { name: "mbe-onboarding" }
  )
);

export { SESSION_DURATION };
