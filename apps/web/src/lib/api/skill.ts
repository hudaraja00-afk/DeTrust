import { api } from './client';

export interface SkillSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
}

export interface SkillListResponse {
  items: SkillSummary[];
  total: number;
  categories: string[];
}

export interface SkillQuery {
  search?: string;
  category?: string;
  limit?: number;
}

export const skillApi = {
  list: (params?: SkillQuery) => {
    const searchParams = new URLSearchParams();

    if (params?.search) {
      searchParams.set('search', params.search);
    }

    if (params?.category) {
      searchParams.set('category', params.category);
    }

    if (params?.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const queryString = searchParams.toString();
    return api.get<SkillListResponse>(`/skills${queryString ? `?${queryString}` : ''}`);
  },
};

export default skillApi;
