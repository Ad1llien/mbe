import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API } from "@/lib/config";
import { useStore } from "@/components/mbe/store";

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) return false;

        // Clear previous user's data before loading new session
        useStore.getState().reset();

        const { access_token, user } = await res.json();
        set({ user, token: access_token, isAuthenticated: true });
        return true;
      },

      logout: () => {
        useStore.getState().reset();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'mbe-auth',
    }
  )
)