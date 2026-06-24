import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { api } from '@/lib/api/client';
import { userApi } from '@/lib/api/user';
import type { User as ApiUser } from '@/lib/api/user';

type User = ApiUser;

const requiresProfileCompletion = (user: User | null) => {
  if (!user) return false;
  if (user.role === 'FREELANCER') {
    return !(user.freelancerProfile && user.freelancerProfile.profileComplete);
  }
  if (user.role === 'CLIENT') {
    const profile = user.clientProfile;
    if (!profile) return true;
    return !(profile.companyName && profile.description && profile.industry);
  }
  return false;
};

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  requires2FA: boolean;
  isNewUser: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;

  // Auth methods
  register: (email: string, password: string, name: string, role: 'CLIENT' | 'FREELANCER') => Promise<boolean>;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<boolean>;
  loginWithWallet: (address: string, signMessage: (message: string) => Promise<string>) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      requires2FA: false,
      isNewUser: false,

      // State setters
      setUser: (user) => set({ user, isAuthenticated: !!user, isNewUser: requiresProfileCompletion(user) }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      clearAuth: () => {
        api.setToken(null);
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          requires2FA: false,
          isNewUser: false,
        });
      },

      // Email registration
      register: async (email, password, name, role) => {
        set({ isLoading: true, error: null });

        const response = await authApi.register({ email, password, name, role });

        if (!response.success || !response.data) {
          set({
            isLoading: false,
            error: response.error?.message || 'Registration failed'
          });
          return false;
        }

        const { user, token } = response.data;
        const nextUser = user as User;

        if (token) api.setToken(token);

        set({
          user: nextUser,
          isAuthenticated: true,
          isLoading: false,
          isNewUser: true,
        });

        return true;
      },

      // Email login
      login: async (email, password, twoFactorCode) => {
        set({ isLoading: true, error: null, requires2FA: false });

        const response = await authApi.login({ email, password, twoFactorCode });

        if (!response.success || !response.data) {
          set({
            isLoading: false,
            error: response.error?.message || 'Login failed'
          });
          return false;
        }

        // Check if 2FA is required
        if (response.data.requires2FA) {
          set({ isLoading: false, requires2FA: true });
          return false;
        }

        const { user, token } = response.data;
        const nextUser = user as User;
        const shouldCompleteProfile = requiresProfileCompletion(nextUser);

        if (token) api.setToken(token);

        set({
          user: nextUser,
          isAuthenticated: true,
          isLoading: false,
          isNewUser: shouldCompleteProfile,
        });

        return true;
      },

      // Wallet login (SIWE)
      loginWithWallet: async (address, signMessage) => {
        set({ isLoading: true, error: null });

        try {
          // Get nonce
          const nonceResponse = await authApi.getWalletNonce(address);

          if (!nonceResponse.success || !nonceResponse.data) {
            throw new Error(nonceResponse.error?.message || 'Failed to get nonce');
          }

          const { message } = nonceResponse.data;

          // Sign message with wallet
          const signature = await signMessage(message);

          // Verify signature
          const verifyResponse = await authApi.verifyWallet(address, signature, message);

          if (!verifyResponse.success || !verifyResponse.data) {
            throw new Error(verifyResponse.error?.message || 'Failed to verify signature');
          }

          const { user, isNewUser, token } = verifyResponse.data;
          const nextUser = user as User;
          const profileIncomplete = requiresProfileCompletion(nextUser);

          if (token) api.setToken(token);

          set({
            user: nextUser,
            isAuthenticated: true,
            isLoading: false,
            isNewUser: isNewUser ?? profileIncomplete,
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Wallet login failed'
          });
          return false;
        }
      },

      // Logout -- clear cookies on the server, then reset client state
      logout: () => {
        authApi.logout().catch(() => {});
        get().clearAuth();
      },

      // Fetch current user (cookies sent automatically via credentials: 'include')
      fetchUser: async () => {
        set({ isLoading: true });

        const response = await userApi.getMe();

        if (response.success && response.data) {
          const nextUser = response.data as User;
          set({
            user: nextUser,
            isAuthenticated: true,
            isLoading: false,
            isNewUser: requiresProfileCompletion(nextUser),
          });

          // Refresh access token so api.getToken() is available for secure file requests
          try {
            const refreshResult = await authApi.refresh();
            if (refreshResult.success && refreshResult.data?.token) {
              api.setToken(refreshResult.data.token);
            }
          } catch {
            // Cookie-based auth still works; token just won't be available as explicit header
          }
        } else {
          get().clearAuth();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'detrust-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isNewUser: state.isNewUser,
      }),
    }
  )
);

export default useAuthStore;
