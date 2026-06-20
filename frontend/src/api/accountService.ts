// Importação corrigida com as chaves para bater com o seu index.ts
import { api } from './index';

export interface AccountRequest {
  name: string;
  balance: number;
}

export interface AccountResponse {
  id: number;
  name: string;
  balance: number;
  userId: number;
}

export const accountService = {
  // GET /api/accounts
  getAll: async (): Promise<AccountResponse[]> => {
    const response = await api.get<AccountResponse[]>('/accounts');
    return response.data;
  },

  // POST /api/accounts
  create: async (data: AccountRequest): Promise<AccountResponse> => {
    const response = await api.post<AccountResponse>('/accounts', data);
    return response.data;
  },
  update: async (id: number, data: AccountRequest): Promise<AccountResponse> => {
    const response = await api.put<AccountResponse>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  }
};

