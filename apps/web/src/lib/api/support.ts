import { api } from './client';

export interface SupportAdminInfo {
  adminId: string;
  adminName: string;
  adminAvatar: string | null;
}

export const supportApi = {
  getAdminId: () => api.get<SupportAdminInfo>('/support/admin-id'),
};

export default supportApi;
