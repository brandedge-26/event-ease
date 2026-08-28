import { create } from "zustand";

export type UserSession = {
  id:        string;
  name:      string;
  email:     string;
  avatarUrl?: string | null;
};

interface UserAuthState {
  accessToken: string | null;
  user:        UserSession | null;
  isLoading:   boolean;

  setAuth:    (token: string, user: UserSession) => void;
  clearAuth:  () => void;
  setLoading: (v: boolean) => void;
}

export const useUserStore = create<UserAuthState>((set) => ({
  accessToken: null,
  user:        null,
  isLoading:   true,

  setAuth:    (accessToken, user) => set({ accessToken, user, isLoading: false }),
  clearAuth:  ()                  => set({ accessToken: null, user: null, isLoading: false }),
  setLoading: (v)                 => set({ isLoading: v }),
}));
