import { api } from './index';

export interface CategoryResponse {
  id: number;
  name: string;
}

export const categoryService = {
  getAll: async (): Promise<CategoryResponse[]> => {
    const response = await api.get<CategoryResponse[]>('/categories');
    return response.data;
  },
};