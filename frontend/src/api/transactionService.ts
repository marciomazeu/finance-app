import { api } from './index';

export interface TransactionRequest {
  description: string;
  amount: number;
  type: number;
  accountId: number;
  categoryId: number;
  date: string;
}

export interface TransactionResponse extends TransactionRequest {
  id: number;
}

export const transactionService = {
  getAll: async (): Promise<TransactionResponse[]> => {
    const response = await api.get<TransactionResponse[]>('/transactions');
    return response.data;
  },
  create: async (data: TransactionRequest): Promise<void> => {
    await api.post('/transactions', data);
  },
  update: async (id: number, data: TransactionRequest): Promise<void> => {
    await api.put(`/transactions/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  }
};