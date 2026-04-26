import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'admin' | 'partner' | null;

interface AuthState {
  role: Role;
  login: (password: string) => boolean;
  logout: () => void;
}

const PARTNER_PIN = '1234';
const ADMIN_PIN = '25110814';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      login: (password: string) => {
        if (password === ADMIN_PIN) {
          set({ role: 'admin' });
          return true;
        } else if (password === PARTNER_PIN) {
          set({ role: 'partner' });
          return true;
        }
        return false;
      },
      logout: () => set({ role: null }),
    }),
    {
      name: 'sb-partner-auth',
    }
  )
);
