import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

      login: async (email: string, password: string) => {
        // Моковые пользователи — потом заменишь на NestJS API
        const mockUsers = [
          {
            id: '1',
            name: 'Admin',
            email: 'admin@mbe.com',
            password: 'admin123',
            role: 'admin' as const,
          },
          {
            id: '2',
            name: 'Manager',
            email: 'manager@mbe.com',
            password: 'manager123',
            role: 'manager' as const,
          },
          {
            id: '3',
            name: 'Cashier',
            email: 'cashier@mbe.com',
            password: 'cashier123',
            role: 'cashier' as const,
          },
        ]

        const found = mockUsers.find(
          (u) => u.email === email && u.password === password
        )

        if (found) {
          const { password: _, ...user } = found
          set({
            user,
            token: 'mock-jwt-token',
            isAuthenticated: true,
          })
          return true
        }

        return false
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'mbe-auth',
    }
  )
)