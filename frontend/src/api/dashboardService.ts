import { api } from ".";

export interface BalanceTrend {
  date: string;
  balance: number;
}

// Dentro do seu objeto dashboardService:
export const dashboardService = {
getBalanceTrend: async (startDate?: string, endDate?: string): Promise<BalanceTrend[]> => {
  const response = await api.get<BalanceTrend[]>('/dashboard/balance-trend', {
    params: { startDate, endDate }
  });
  // Se o axios retornar envelopado, use o seu ensureArray aqui
  return response.data;
}
}