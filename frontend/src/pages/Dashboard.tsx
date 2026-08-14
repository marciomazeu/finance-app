import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../api'; 
import { transactionService } from '../api/transactionService';
import { NewTransactionForm } from '../components/NewTransactionForm';
import { EditTransactionForm } from '../components/EditTransactionForm';
import { toast } from 'react-toastify';
import { NewAccountForm } from '../components/NewAccountForm';
import { EditAccountForm } from '../components/EditAccountForm';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CategorySummaryList } from '../components/CategorySummaryList';

interface TransactionItem {
  id: number;
  description: string;
  amount: number;
  type: number; 
  date: string;
  accountId: number;
  categoryId: number;
}

interface DashboardData {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
}

interface BalanceTrendItem {
  date: string;
  balance: number;
}

interface AccountItem {
  id: number;
  name: string;
  balance: number;
}

interface UserProfile {
  name: string;
  email: string;
  memberSince: string;
  totalAccountsCount: number;
}

interface CategoryItem {
  id: number;
  name: string;
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | string>('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalIncomes: 0,
    totalExpenses: 0,
    balance: 0
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Márcio Mazeu',
    email: 'marcio@email.com', 
    memberSince: 'Janeiro de 2026',
    totalAccountsCount: 0
  });
  
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('@FinanceApp:token') || sessionStorage.getItem('@FinanceApp:token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn("Nenhum token encontrado no localStorage ou sessionStorage!");
      }
      
      const responseSummary = await api.get<any>('/transactions/dashboard'); 
      const totalBalance = responseSummary.data.balance ?? responseSummary.data.Balance ?? 0;
      
      setData({
        totalIncomes: responseSummary.data.totalIncomes ?? responseSummary.data.TotalIncomes ?? 0,
        totalExpenses: responseSummary.data.totalExpenses ?? responseSummary.data.TotalExpenses ?? 0,
        balance: totalBalance
      });

      try {
        const responseAccounts = await api.get<any[]>('/accounts'); 
        if (Array.isArray(responseAccounts.data)) {
          const formattedAccounts = responseAccounts.data.map((acc: any) => ({
            id: acc.id ?? acc.Id ?? 0,
            name: acc.name ?? acc.Name ?? 'Sem Nome',
            balance: acc.balance ?? acc.Balance ?? 0
          }));
          setAccounts(formattedAccounts);
        } else {
          setAccounts([]);
        }
      } catch (accError) {
        console.error("Erro ao buscar contas:", accError);
        setAccounts([]);
      }

      try {
        const responseCategories = await api.get<any[]>('/categories'); 
        if (Array.isArray(responseCategories.data)) {
          const formattedCategories = responseCategories.data.map((cat: any) => ({
            id: cat.id ?? cat.Id ?? 0,
            name: cat.name ?? cat.Name ?? 'Geral'
          }));
          setCategories(formattedCategories);
        } else {
          setCategories([{ id: 1, name: 'Geral' }]); 
        }
      } catch (catError) {
        console.error("Erro ao buscar categorias:", catError);
        setCategories([{ id: 1, name: 'Geral' }]);
      }

      const responseTransactions = await api.get<any[]>('/transactions');
      const transactionsList = responseTransactions.data || [];
      setTransactions(transactionsList);

    } catch (error) {
      console.error('Erro geral ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTransactionSaved = () => {
    setIsModalOpen(false);
    loadDashboardData(); 
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta transação? O saldo da conta será recalculado.')) return;

    try {
      await transactionService.delete(id);
      toast.success('Transação removida do histórico.');
      loadDashboardData(); 
    } catch (error: any) {
      toast.error('Não foi possível deletar a transação.');
    }
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sem Categoria';
  };

  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.")) {
      return;
    }

    const currentToken = localStorage.getItem('@FinanceApp:token') || sessionStorage.getItem('@FinanceApp:token');
    const config = {
      headers: { Authorization: `Bearer ${currentToken}` }
    };

    try {
      await axios.delete(`http://localhost:5211/api/accounts/${id}`, config);
      setSelectedAccountId('all');
      loadDashboardData(); 
      toast.success("Conta excluída com sucesso!");
    } catch (err: any) {
      const errorMsg = err.response?.data || "Erro ao excluir a conta.";
      toast.error(errorMsg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@FinanceApp:token');
    sessionStorage.removeItem('@FinanceApp:token');
    if (api.defaults.headers.common['Authorization']) {
      delete api.defaults.headers.common['Authorization'];
    }
    toast.info('Sessão encerrada. Redirecionando...');
    window.location.href = '/login'; 
  };

  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date || '');
    const matchesAccount = selectedAccountId === 'all' || t.accountId === Number(selectedAccountId);
    const matchesMonth = transactionDate.getUTCMonth() === selectedMonth;
    const matchesYear = transactionDate.getUTCFullYear() === selectedYear;
    return matchesAccount && matchesMonth && matchesYear;
  });

  const activeAccount = accounts.find(a => a.id === Number(selectedAccountId));
  const displayBalance = selectedAccountId === 'all' ? data.balance : (activeAccount?.balance ?? 0);

  // AJUSTE: Filtro de Tendência focado nos ÚLTIMOS 30 DIAS
  const filteredTrendData = (() => {
    if (!transactions || transactions.length === 0) {
      return [{ date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), balance: displayBalance }];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filtra transações dos últimos 30 dias e da conta selecionada
    const txsUltimos30Dias = transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesAccount = selectedAccountId === 'all' || t.accountId === Number(selectedAccountId);
      return matchesAccount && tDate >= thirtyDaysAgo;
    });

    const sorted = [...txsUltimos30Dias].sort((a, b) => {
      const dateA = a?.date ? new Date(a.date).getTime() : 0;
      const dateB = b?.date ? new Date(b.date).getTime() : 0;
      return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
    });

    let runningBalance = displayBalance;

    sorted.forEach((t) => {
      if (t.type === 1) runningBalance -= t.amount;
      else runningBalance += t.amount;
    });

    const tLine = sorted.map((t) => {
      if (t.type === 1) runningBalance += t.amount;
      else runningBalance -= t.amount;

      return {
        dateKey: t.date.split('T')[0],
        dateLabel: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        balance: runningBalance
      };
    });

    const uniquesByDay: { [key: string]: typeof tLine[0] } = {};
    tLine.forEach(item => {
      uniquesByDay[item.dateKey] = item;
    });

    return Object.values(uniquesByDay).map(item => ({
      date: item.dateLabel,
      balance: item.balance
    }));
  })();

  // Dados do gráfico de Despesas
const mockChartData = (() => { 

if (selectedAccountId === 'all') { 

return [{ name: 'Total Acumulado', Incomes: data.totalIncomes, Expenses: data.totalExpenses }]; 

} 

 

let incomesDaConta = 0; 

let expensesDaConta = 0; 

 

filteredTransactions.forEach(t => { 

if (t.type === 1) incomesDaConta += t.amount;  

else expensesDaConta += t.amount;  

}); 

 

return [{ name: 'Total Acumulado', Incomes: incomesDaConta, Expenses: expensesDaConta }]; 

})(); 
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Menu de Navegação Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{ background: 'none', border: 'none', padding: '10px', fontSize: '16px', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', color: activeTab === 'dashboard' ? '#007bff' : '#666', borderBottom: activeTab === 'dashboard' ? '3px solid #007bff' : 'none', cursor: 'pointer' }}
          >
            Painel Geral
          </button>
          <button 
            onClick={() => {
              setActiveTab('profile');
              setProfile(prev => ({ ...prev, totalAccountsCount: accounts.length }));
            }}
            style={{ background: 'none', border: 'none', padding: '10px', fontSize: '16px', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', color: activeTab === 'profile' ? '#007bff' : '#666', borderBottom: activeTab === 'profile' ? '3px solid #007bff' : 'none', cursor: 'pointer' }}
          >
            Meu Perfil
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            style={{ padding: '10px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            + Nova Conta
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            + Nova Transação
          </button>

          <button 
            onClick={() => navigate('/investments')} 
            style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            🚀 Investimentos
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Cards de Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #007bff' }}>
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>SALDO ATUAL</span>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: displayBalance >= 0 ? '#333' : '#dc3545' }}>
                R$ {displayBalance.toFixed(2)}
              </h2>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #28a745' }}>
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>RECEITAS (ENTRADAS)</span>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#28a745' }}>
                R$ {data.totalIncomes.toFixed(2)}
              </h2>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #dc3545' }}>
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>DESPESAS (SAÍDAS)</span>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#dc3545' }}>
                R$ {selectedAccountId === 'all' ? data.totalExpenses.toFixed(2) : mockChartData[0].Expenses.toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Conta:</label>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '200px' }}>
                <option value="all">Todas as Contas (Geral)</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Mês:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}>
                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Ano:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {selectedAccountId !== 'all' && (
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button
                  onClick={() => {
                    const accountToEdit = accounts.find(a => String(a.id) === String(selectedAccountId));
                    if (accountToEdit) setEditingAccount(accountToEdit);
                  }}
                  style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  ✏️ Editar Conta
                </button>
                <button 
                  onClick={() => handleDeleteAccount(Number(selectedAccountId))}
                  style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  🗑️ Excluir Conta
                </button>
              </div>
            )}
          </div>

          {/* Grid dos 3 Gráficos da Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            
            {/* 1. Resumo por Categorias */}
            <CategorySummaryList 
              month={Number(selectedMonth) + 1}
              year={selectedYear} 
              accountId={selectedAccountId} 
            />

            {/* 2. Total de Despesas (Barra de Saídas) */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Total de Despesas (Saídas)</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Despesas']} />
                    {/* APENAS A BARRA DE DESPESAS */}
                    <Bar dataKey="Incomes" name="Receitas" fill="#28a745" radius={[4, 4, 0, 0]} /> 
<Bar dataKey="Expenses" name="Despesas" fill="#dc3545" radius={[4, 4, 0, 0]} /> 
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Tendência de Saldo (Últimos 30 Dias) */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Tendência de Saldo (Últimos 30 dias)</h3>
              {!filteredTrendData || filteredTrendData.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '120px 0' }}>Nenhum dado de saldo encontrado para o período.</p>
              ) : (
                <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" stroke="#888888" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Saldo']} />
                      <Line type="monotone" dataKey="balance" stroke="#007bff" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Transações */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Últimas Transações</h3>
            {filteredTransactions.length === 0 ? (
              <p style={{ color: '#666' }}>Nenhuma transação cadastrada ainda para o período selecionado.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '12px 16px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>Data</th>
                      <th style={{ padding: '12px 16px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>Descrição</th>
                      <th style={{ padding: '12px 16px', color: '#666', fontWeight: 'bold', fontSize: '14px' }}>Categoria</th>
                      <th style={{ padding: '12px 16px', color: '#666', fontWeight: 'bold', fontSize: '14px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px 16px', color: '#666', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '14px 16px', color: '#555', fontSize: '14px', whiteSpace: 'nowrap' }}>
                          {new Date(t.date).getUTCDate().toString().padStart(2, '0')}/
                          {(new Date(t.date).getUTCMonth() + 1).toString().padStart(2, '0')}/
                          {new Date(t.date).getUTCFullYear()}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '500', color: '#333', fontSize: '14px' }}>{t.description}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                            🏷️ {getCategoryName(t.categoryId)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: t.type === 1 ? '#28a745' : '#dc3545', fontWeight: 'bold', fontSize: '15px', textAlign: 'right' }}>
                          {t.type === 1 ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button onClick={() => setEditingTransaction(t)} style={{ padding: '6px 12px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Editar</button>
                            <button onClick={() => handleDeleteTransaction(t.id)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Tela de Perfil */
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold' }}>
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#333' }}>{profile.name}</h2>
              <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '14px' }}>Usuário do FinanceApp</p>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>E-mail:</span>
              <span style={{ color: '#333' }}>{profile.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>Membro desde:</span>
              <span style={{ color: '#333' }}>{profile.memberSince}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>Contas Bancárias Ativas:</span>
              <span style={{ color: '#007bff', fontWeight: 'bold' }}>{profile.totalAccountsCount} cadastradas</span>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', marginTop: '30px', padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Sair da Conta
          </button>
        </div>
      )}

      {/* Modais */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            <NewTransactionForm onSave={handleTransactionSaved} />
          </div>
        </div>
      )}

      {editingTransaction && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px' }}>
            <button onClick={() => setEditingTransaction(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            <EditTransactionForm 
              transaction={editingTransaction} 
              onSave={() => {
                setEditingTransaction(null);
                toast.success('Transação atualizada com sucesso! ✨'); 
                loadDashboardData();       
              }} 
            />
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px' }}>
            <button onClick={() => setIsAccountModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            <NewAccountForm 
              onSave={() => { 
                setIsAccountModalOpen(false); 
                loadDashboardData();          
                toast.success('Nova conta adicionada com sucesso! 🏦');
              }} 
            />
          </div>
        </div>
      )}

      {editingAccount && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px' }}>
            <button onClick={() => setEditingAccount(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            <EditAccountForm 
              account={editingAccount} 
              onSave={() => {
                setEditingAccount(null);
                loadDashboardData(); 
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}