import { api } from './client';

// Auth types
interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'CLIENT' | 'FREELANCER';
}

interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface WalletNonceResponse {
  nonce: string;
  message: string;
}

interface AuthResponse {
  user: {
    id: string;
    email?: string;
    walletAddress?: string;
    name?: string;
    role: string;
  };
  token: string;
  refreshToken: string;
  expiresAt: string;
  isNewUser?: boolean;
  requires2FA?: boolean;
}

interface TwoFASetupResponse {
  secret: string;
  qrCodeUrl: string;
}

// Auth API functions
export const authApi = {
  // Email auth
  register: (data: RegisterData) => 
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: LoginData) => 
    api.post<AuthResponse>('/auth/login', data),
  
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    api.post('/auth/reset-password', { token, password }),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  // Wallet auth (SIWE)
  getWalletNonce: (address: string) => 
    api.post<WalletNonceResponse>('/auth/wallet/nonce', { address }),
  
  verifyWallet: (address: string, signature: string, message: string) => 
    api.post<AuthResponse>('/auth/wallet/verify', { address, signature, message }),
  
  // 2FA
  setup2FA: () => 
    api.post<TwoFASetupResponse>('/auth/2fa/setup'),
  
  verify2FA: (code: string) => 
    api.post<{ success: boolean; backupCodes: string[] }>('/auth/2fa/verify', { code }),
  
  disable2FA: (code: string, password: string) =>
    api.post<{ success: boolean }>('/auth/2fa/disable', { code, password }),
  
  // Session
  getMe: () =>
    api.get<{ userId: string; userRole: string; email?: string; walletAddress?: string }>('/auth/me'),

  refresh: () =>
    api.post<{ token: string; expiresAt: string }>('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),
};

export default authApi;
