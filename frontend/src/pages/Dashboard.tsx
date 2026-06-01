import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

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
  
  // Estados de dados da API
  const [summary, setSummary] = useState<SummaryData>({ totalIncomes: 0, totalExpenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Controle do Modal e do Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Data de hoje como padrão
  const [type, setType] = useState(2); // 2 = Saída/Despesa como padrão
  const [formLoading, setFormLoading] = useState(false);

  // Função isolada para recarregar os dados do painel após uma inserção
  async function loadDashboardData() {
    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([
        api.get<SummaryData>('/Dashboard/summary'),
        api.get<Transaction[]>('/Transactions')
      ]);
      setSummary(summaryResponse.data);
      setTransactions(transactionsResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      localStorage.removeItem('@FinanceApp:token');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [navigate]);

  // Envio do formulário para a API .NET
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return alert('Preencha todos os campos!');

    setFormLoading(true);
    try {
      // Envia o exato formato que seu backend espera
      await api.post('/Transactions', {
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        type: Number(type),
        categoryId: 1, // IDs fixos temporariamente até você implementar categorias/contas
        accountId: 1
      });

      // Se salvou com sucesso:
      setIsModalOpen(false); // Fecha o modal
      setDescription('');    // Limpa os campos
      setAmount('');
      
      // Atualiza o Dashboard com os novos valores e a tabela nova
      await loadDashboardData(); 
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Falha ao salvar a transação. Verifique os dados.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@FinanceApp:token');
    navigate('/');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
  };

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
          <div className="flex gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
            >
              + Nova Transação
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
            >
              Sair
            </button>
          </div>
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
          </div>

          {/* Card Saídas */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Saídas</span>
              <span className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">▼ Despesas</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(summary.totalExpenses)}</h2>
          </div>

          {/* Card Saldo Total */}
          <div className="bg-slate-900 p-6 rounded-xl shadow-xs text-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-400">Saldo Atual</span>
              <span className="p-2 bg-white/10 text-white rounded-lg text-xs font-bold">💰 Total</span>
            </div>
            <h2 className="text-3xl font-bold">{formatCurrency(summary.balance)}</h2>
          </div>
        </div>

        {/* TABELA DE TRANSAÇÕES */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Últimas Atividades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-6">Descrição</th>
                  <th className="py-3 px-6">Data</th>
                  <th className="py-3 px-6 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">{item.description}</td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(item.date)}</td>
                    <td className={`py-4 px-6 text-right font-semibold ${item.type === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 1 ? '+ ' : '- '}{formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FLUTUANTE DO FORMULÁRIO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Nova Movimentação</h3>
              
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Aluguel, Mercado, Salário"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor ($ CAD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Movimentação</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button
                      type="button"
                      onClick={() => setType(1)}
                      className={`p-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        type === 1 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      ▲ Receita (Entrada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType(2)}
                      className={`p-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        type === 2 
                          ? 'bg-red-50 border-red-500 text-red-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      ▼ Gasto (Saída)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {formLoading ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}