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
  type: number;
  categoryId: number;
  accountId: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Estados de dados da API
  const [summary, setSummary] = useState<SummaryData>({ totalIncomes: 0, totalExpenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(2);
  const [formLoading, setFormLoading] = useState(false);
  
  // ESTADOS PARA O MODAL DE EXCLUSÃO CUSTOMIZADO
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Função para carregar/atualizar os dados do painel
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

  // Envio do formulário de cadastro
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) return alert('Preencha todos os campos!');

    setFormLoading(true);
    try {
      await api.post('/Transactions', {
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        type: Number(type),
        categoryId: 1,
        accountId: 1
      });

      setIsModalOpen(false);
      setDescription('');
      setAmount('');
      await loadDashboardData(); 
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Falha ao salvar a transação.');
    } finally {
      setFormLoading(false);
    }
  };

  // Prepara a exclusão abrindo o modal customizado
  const openDeleteConfirmation = (id: number) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Executa a exclusão de fato após o usuário confirmar no modal
  const confirmDeleteTransaction = async () => {
    if (idToDelete === null) return;

    setDeletingId(idToDelete);
    try {
      await api.delete(`/Transactions/${idToDelete}`);
      setIsDeleteModalOpen(false); // Fecha o modal
      setIdToDelete(null);
      await loadDashboardData();   // Recarrega os dados
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      alert('Não foi possível deletar esta transação.');
    } finally {
      setDeletingId(null);
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
              className="px-4 py-2 bg-slate-990 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
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
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Entradas</span>
              <span className="p-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold">▲ Receitas</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(summary.totalIncomes)}</h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">Saídas</span>
              <span className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">▼ Despesas</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">{formatCurrency(summary.totalExpenses)}</h2>
          </div>

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
                  <th className="py-3 px-6 text-center w-24">Ações</th>
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
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openDeleteConfirmation(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                        title="Deletar transação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: FORMULÁRIO DE CADASTRO (Mantido igual) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Nova Movimentação</h3>
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor ($ CAD)</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Movimentação</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button type="button" onClick={() => setType(1)} className={`p-2.5 rounded-lg border text-sm font-medium ${type === 1 ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200'}`}>▲ Receita</button>
                    <button type="button" onClick={() => setType(2)} className={`p-2.5 rounded-lg border text-sm font-medium ${type === 2 ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200'}`}>▼ Gasto</button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg">{formLoading ? 'Salvando...' : 'Confirmar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NOVO MODAL 2: CONFIRMAÇÃO DE EXCLUSÃO CUSTOMIZADO */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-center w-12 h-12 bg-red-50 text-red-600 rounded-full mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Excluir Transação</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Tem certeza que deseja apagar este registro? Esta ação não poderá ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setIdToDelete(null); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTransaction}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId !== null ? 'Apagando...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}