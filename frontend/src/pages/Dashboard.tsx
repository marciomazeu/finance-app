import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

// Definição das estruturas de dados (TypeScript Interfaces)
interface SummaryData {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
}

interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  type: number; // 1 = Entrada, 2 = Saída
  categoryId: number;
  accountId: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Estados para armazenar os dados da API
  const [summary, setSummary] = useState<SummaryData>({ totalIncomes: 0, totalExpenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Dispara as duas requisições ao mesmo tempo para ganhar performance
        const [summaryResponse, transactionsResponse] = await Promise.all([
          api.get<SummaryData>('/Dashboard/summary'),
          api.get<Transaction[]>('/Transactions') // <-- Ajuste aqui se a rota for diferente
        ]);

        setSummary(summaryResponse.data);
        setTransactions(transactionsResponse.data);
      } catch (error) {
        console.error('Erro ao carregar dados do painel:', error);
        localStorage.removeItem('@FinanceApp:token');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('@FinanceApp:token');
    navigate('/');
  };

  // Formata os números em Dólar Canadense (CAD)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  };

  // Formata a string de data da API para o padrão local (DD/MM/AAAA)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600 font-medium">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* TOPO / HEADER */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Minhas Finanças</h1>
            <p className="text-sm text-slate-500">Controle o seu dinheiro de forma simples</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            Sair
          </button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card Entradas */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Entradas</span>
              <span className="p-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold">▲ Receitas</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(summary.totalIncomes)}</h2>
            <p className="text-xs text-green-600 mt-2 font-medium">Este mês</p>
          </div>

          {/* Card Saídas */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Saídas</span>
              <span className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">▼ Despesas</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(summary.totalExpenses)}</h2>
            <p className="text-xs text-red-600 mt-2 font-medium">Este mês</p>
          </div>

          {/* Card Saldo Total */}
          <div className="bg-slate-900 p-6 rounded-xl shadow-xs text-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-400">Saldo Atual</span>
              <span className="p-2 bg-white/10 text-white rounded-lg text-xs font-bold">💰 Total</span>
            </div>
            <h2 className="text-3xl font-bold">{formatCurrency(summary.balance)}</h2>
            <p className="text-xs text-slate-400 mt-2 font-medium">Disponível para uso</p>
          </div>
        </div>

        {/* TABELA DE TRANSAÇÕES DINÂMICA */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Últimas Atividades</h3>
            <p className="text-xs text-slate-500">Histórico de movimentações recentes</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Descrição</th>
                  <th className="py-3 px-6">Data</th>
                  <th className="py-3 px-6 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                ) : (
                  transactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {formatDate(item.date)}
                      </td>
                      <td className={`py-4 px-6 text-right font-semibold ${
                        item.type === 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 1 ? '+ ' : '- '}
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}