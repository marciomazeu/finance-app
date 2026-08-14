import React, { useEffect, useState } from 'react';
// IMPORTANTE: Use o seu serviço de API existente em vez do axios puro
import {api} from '../api/index.ts'; // <--- Ajuste o caminho relativo até a sua pasta de services

interface CategorySummary {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

interface CategorySummaryListProps {
  month: number | string;
  year: number | string;
  accountId?: number | string;
}

export const CategorySummaryList: React.FC<CategorySummaryListProps> = ({
  month,
  year,
  accountId,
}) => {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

 useEffect(() => {
  const fetchCategorySummary = async () => {
    setLoading(true);
    try {
      // 1. Trata o accountId: só usa se for um número válido
      const parsedAccount = accountId ? Number(accountId) : null;
      const validAccountId =
        parsedAccount && !isNaN(parsedAccount) && parsedAccount > 0
          ? parsedAccount
          : undefined;

      // 2. Faz a chamada passando os parâmetros
      const response = await api.get<CategorySummary[]>(
        '/transactions/categories-summary',
        {
          params: {
            month: Number(month),
            year: Number(year),
            accountId: validAccountId, // Se for undefined, o Axios remove do parâmetro da URL automaticamente
          },
        }
      );

      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar resumo de categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchCategorySummary();
}, [month, year, accountId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Carregando categorias...
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Nenhum dado cadastrado para o período.
      </div>
    );
  }

  // Ordena do maior gasto para o menor
  const sortedCategories = [...categories].sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  return (
    <div className="w-full space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Gastos por Categoria
      </h3>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {sortedCategories.map((item) => (
          <div key={item.categoryId} className="flex flex-col space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">
                {item.categoryName}
              </span>
              <div className="text-right">
                <span className="font-bold text-gray-900 mr-2">
                  R$ {item.totalAmount.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};