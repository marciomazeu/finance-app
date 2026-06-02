import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
// ADICIONADO COMPONENTES DE LINHA/ÁREA DO RECHARTS
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

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

interface Category {
  id: number;
  name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Estados de dados da API
  const [summary, setSummary] = useState<SummaryData>({ totalIncomes: 0, totalExpenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário de Cadastro/Edição de Transações
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(2);
  const [categoryId, setCategoryId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Estados para o Modal de Categoria
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // Estados para o Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadDashboardData() {
    try {
      const [summaryResponse, transactionsResponse, categoriesResponse] = await Promise.all([
        api.get<SummaryData>('/Dashboard/summary'),
        api.get<Transaction[]>('/Transactions'),
        api.get<Category[]>('/Categories')
      ]);
      
      setSummary(summaryResponse.data);
      setTransactions(transactionsResponse.data);
      setCategories(categoriesResponse.data);

      if (categoriesResponse.data.length > 0 && !categoryId) {
        setCategoryId(categoriesResponse.data[0].id.toString());
      }
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

  // --- PREPARAÇÃO DOS DADOS PARA OS GRÁFICOS ---

  // 1. Gráfico de Barras (Fluxo de Caixa)
  const barChartData = [
    { name: 'Receitas', valor: summary.totalIncomes },
    { name: 'Despesas', valor: summary.totalExpenses }
  ];

  // 2. Gráfico de Pizza (Despesas por Categoria)
  const expenseTransactions = transactions.filter(t => t.type === 2);
  const categoryMap: { [key: string]: number } = {};

  expenseTransactions.forEach(t => {
    const catName = categories.find(c => c.id === t.categoryId)?.name || 'Geral';
    categoryMap[catName] = (categoryMap[catName] || 0) + t.amount;
  });

  const pieChartData = Object.keys(categoryMap).map(name => ({
    name,
    value: categoryMap[name]
  }));

  const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // 3. NOVO: Gráfico de Linha/Área (Evolução do Saldo)
  // Ordena as transações da mais antiga para a mais recente para calcular o saldo cronologicamente
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentAccumulatedBalance = 0;
  const balanceChartData = sortedTransactions.map(t => {
    if (t.type === 1) {
      currentAccumulatedBalance += t.amount; // Soma receita
    } else {
      currentAccumulatedBalance -= t.amount; // Subtrai despesa
    }
    
    return {
      date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(t.date)),
      Saldo: currentAccumulatedBalance,
      Movimentacao: t.description
    };
  });

  // --- FUNÇÕES DE HANDLERS (Mantidas iguais) ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return alert('Digite o nome da categoria!');
    setCategoryLoading(true);
    try {
      const response = await api.post<Category>('/Categories', { name: newCategoryName });
      const categoriesResponse = await api.get<Category[]>('/Categories');
      setCategories(categoriesResponse.data);
      setCategoryId(response.data.id.toString());
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
    } catch (error) {
      console.error(error);
      alert('Falha ao cadastrar a categoria.');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTransactionId(null);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setType(2);
    if (categories.length > 0) setCategoryId(categories[0].id.toString());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setDate(transaction.date.split('T')[0]);
    setType(transaction.type);
    setCategoryId(transaction.categoryId.toString());
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !categoryId) return alert('Preencha todos os campos!');
    setFormLoading(true);
    const payload = {
      description,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      type: Number(type),
      categoryId: Number(categoryId),
      accountId: 1
    };
    try {
      if (editingTransactionId) {
        await api.put(`/Transactions/${editingTransactionId}`, { id: editingTransactionId, ...payload });
      } else {
        await api.post('/Transactions', payload);
      }
      setIsModalOpen(false);
      await loadDashboardData();
    } catch (error) {
      console.error(error);
      alert('Falha ao salvar transação.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteConfirmation = (id: number) => { setIdToDelete(id); setIsDeleteModalOpen(true); };
  const confirmDeleteTransaction = async () => {
    if (idToDelete === null) return;
    setDeletingId(idToDelete);
    try {
      await api.delete(`/Transactions/${idToDelete}`);
      setIsDeleteModalOpen(false);
      setIdToDelete(null);
      await loadDashboardData();
    } catch (error) { console.error(error); alert('Erro ao deletar.'); }
    finally { setDeletingId(null); }
  };
  const handleLogout = () => { localStorage.removeItem('@FinanceApp:token'); navigate('/'); };
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  const getCategoryName = (id: number) => { const cat = categories.find(c => c.id === id); return cat ? cat.name : 'Geral'; };

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><p className="text-slate-600 font-medium">Carregando dados...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Minhas Finanças</h1>
            <p className="text-sm text-slate-500">Controle o seu dinheiro de forma simples</p>
          </div>
          <div className="flex gap-4">
            <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-xs">+ Nova Transação</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-xs">Sair</button>
          </div>
        </div>

        {/* RESUMO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60"><div className="flex justify-between items-center mb-4"><span className="text-sm font-medium text-slate-500">Entradas</span><span className="p-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold">▲ Receitas</span></div><h2 className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalIncomes)}</h2></div>
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60"><div className="flex justify-between items-center mb-4"><span className="text-sm font-medium text-slate-500">Saídas</span><span className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">▼ Despesas</span></div><h2 className="text-3xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</h2></div>
          <div className="bg-slate-900 p-6 rounded-xl shadow-xs text-white"><div className="flex justify-between items-center mb-4"><span className="text-sm font-medium text-slate-400">Saldo Atual</span><span className="p-2 bg-white/10 text-white rounded-lg text-xs font-bold">💰 Total</span></div><h2 className="text-3xl font-bold">{formatCurrency(summary.balance)}</h2></div>
        </div>

        {/* SEÇÃO DE GRÁFICOS */}
        <div className="space-y-6 mb-8">
          
          {/* NOVO GRÁFICO: Evolução do Saldo (Largura Total) */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
            <h3 className="text-base font-bold text-slate-800 mb-1">Evolução do Saldo</h3>
            <p className="text-xs text-slate-400 mb-4">Veja a variação do seu patrimônio com base no histórico</p>
            <div className="h-64">
              {balanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(label, items) => {
                        const item = items[0]?.payload;
                        return item ? `${label} - ${item.Movimentacao}` : label;
                      }}
                    />
                    <Area type="monotone" dataKey="Saldo" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorSaldo)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center"><p className="text-sm text-slate-400">Insira transações para ver o histórico do saldo.</p></div>
              )}
            </div>
          </div>

          {/* Gráficos de Fluxo e Categorias (Lado a Lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de Barras: Fluxo */}
            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
              <h3 className="text-base font-bold text-slate-800 mb-4">Fluxo de Caixa</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Pizza: Categorias */}
            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200/60">
              <h3 className="text-base font-bold text-slate-800 mb-4">Gastos por Categoria</h3>
              <div className="h-64 flex items-center justify-center">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400">Nenhuma despesa cadastrada para gerar o gráfico.</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* TABELA */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Últimas Atividades</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-6">Descrição</th>
                  <th className="py-3 px-6">Categoria</th>
                  <th className="py-3 px-6">Data</th>
                  <th className="py-3 px-6 text-right">Valor</th>
                  <th className="py-3 px-6 text-center w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800">{item.description}</td>
                    <td className="py-4 px-6 text-slate-500"><span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">{getCategoryName(item.categoryId)}</span></td>
                    <td className="py-4 px-6 text-slate-500">{formatDate(item.date)}</td>
                    <td className={`py-4 px-6 text-right font-semibold ${item.type === 1 ? 'text-green-600' : 'text-red-600'}`}>{item.type === 1 ? '+ ' : '- '}{formatCurrency(item.amount)}</td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-1">
                      <button onClick={() => handleOpenEditModal(item)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-blue-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></button>
                      <button onClick={() => openDeleteConfirmation(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DE TRANSAÇÕES */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{editingTransactionId ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
              <form onSubmit={handleSaveTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor ($ CAD)</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                  <div className="flex gap-2">
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm bg-white">
                      {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-200">+</button>
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

        {/* MODAL CADASTRO DE CATEGORIA */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xs w-full p-6 shadow-2xl border border-slate-100">
              <h4 className="text-lg font-bold text-slate-800 mb-3">Nova Categoria</h4>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Categoria</label>
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Transporte, Lazer, Estudos" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" autoFocus />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(''); }} className="flex-1 px-3 py-2 text-sm font-medium text-slate-500 bg-slate-55 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={categoryLoading} className="flex-1 px-3 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg">{categoryLoading ? 'Salvando...' : 'Adicionar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"><div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100"><div className="flex items-center justify-center w-12 h-12 bg-red-50 text-red-600 rounded-full mb-4 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg></div><h3 className="text-lg font-bold text-slate-800 text-center mb-2">Excluir Transação</h3><p className="text-sm text-slate-500 text-center mb-6">Tem certeza que deseja apagar este registro? Esta ação não poderá ser desfeita.</p><div className="flex gap-3"><button type="button" onClick={() => { setIsDeleteModalOpen(false); setIdToDelete(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg">Cancelar</button><button type="button" onClick={confirmDeleteTransaction} disabled={deletingId !== null} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg">{deletingId !== null ? 'Apagando...' : 'Sim, Excluir'}</button></div></div></div>)}

      </div>
    </div>
  );
}