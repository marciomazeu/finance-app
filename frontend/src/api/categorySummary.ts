// services/api.ts
import axios from 'axios';
import type { CategorySummaryResponse } from '../DTO/CategorySummaryResponse';

export const getCategorySummary = async (
  startDate?: string,
  endDate?: string
): Promise<CategorySummaryResponse[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await axios.get<CategorySummaryResponse[]>(
    `/api/transactions/categories-summary?${params.toString()}`
  );
  return response.data;
};