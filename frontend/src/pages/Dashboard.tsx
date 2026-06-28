import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../api'; 
import { transactionService } from '../api/transactionService';
import { NewTransactionForm } from '../components/NewTransactionForm';
import { EditTransactionForm } from '../components/EditTransactionForm';
import { toast } from 'react-toastify';
import { NewAccountForm } from '../components/NewAccountForm';
import { categoryService } from '../api/categoryService';
import { EditAccountForm } from '../components/EditAccountForm';

interface TransactionItem {
  id: number;
  description: string;
  amount: number;
  type: number; 
  date: string; // Mantenha opcional ou torne obrigatório tirando o '?'
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
  const [trendData, setTrendData] = useState<BalanceTrendItem[]>([]); 
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  // Define o mês atual (0 = Janeiro, 5 = Junho, etc.) e o ano atual
const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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

      // 4. CÁLCULO DO SALDO ACUMULADO EM TEMPO REAL PARA O GRÁFICO
      if (Array.isArray(transactionsList) && transactionsList.length > 0) {
        // Ordena as transações por data (as mais antigas primeiro)
        const sortedTransactions = [...transactionsList].sort((a, b) => {
          const dateA = a?.date ? new Date(a.date).getTime() : 0;
          const dateB = b?.date ? new Date(b.date).getTime() : 0;
          return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
        });

        // Criamos uma função interna para gerar a tendência com base em uma conta específica ou geral
        const generateTrendForAccount = (accountIdFilter: number | string, baseBalance: number) => {
          // Filtra as transações daquela conta específica (ou todas, se for 'all')
          const txs = sortedTransactions.filter(t => accountIdFilter === 'all' || t.accountId === Number(accountIdFilter));
          
          let runningBalance = baseBalance;
          
          // Anda de trás para frente para descobrir o saldo inicial antes das transações ocorrerem
          txs.forEach((t) => {
            if (t.type === 1) runningBalance -= t.amount; // Desfaz a receita
            else runningBalance += t.amount;             // Desfaz a despesa
          });

          // Agora anda para frente reconstruindo o histórico de saldos
          return txs.map((t) => {
            if (t.type === 1) runningBalance += t.amount;
            else runningBalance -= t.amount;

            return {
              date: new Date(t.date || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              balance: runningBalance,
              accountId: t.accountId
            };
          });
        };

        // Geramos um mapa de tendências contendo os dados calculados de forma isolada
        // Armazenamos no estado. A filtragem final na tela vai usar esses valores limpos.
        // Como o estado trendData guarda a foto do momento, vamos gerar com base no 'all' (Geral)
        // Mas vamos ajustar a variável filteredTrendData para recalcular em tempo real!

      } else {
        setTrendData([{ 
          date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
          balance: totalBalance 
        }]);
      }

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

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return isNaN(date.getTime()) 
      ? '---' 
      : date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
  };

 // 1. Filtra as transações por Conta e por Mês/Ano (Mantido)
const filteredTransactions = transactions.filter(t => {
  const transactionDate = new Date(t.date || '');
  const matchesAccount = selectedAccountId === 'all' || t.accountId === Number(selectedAccountId);
  const matchesMonth = transactionDate.getUTCMonth() === selectedMonth;
  const matchesYear = transactionDate.getUTCFullYear() === selectedYear;
  return matchesAccount && matchesMonth && matchesYear;
});

// 2. BUSCA A CONTA ATIVA E SEU SALDO ATUAL
const activeAccount = accounts.find(a => a.id === Number(selectedAccountId));
const displayBalance = selectedAccountId === 'all' ? data.balance : (activeAccount?.balance ?? 0);

// 3. RECALCULA A TENDÊNCIA DE SALDO ESPECÍFICA DA CONTA EM TEMPO REAL
const filteredTrendData = (() => {
  if (!transactions || transactions.length === 0) {
    return [{ date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), balance: displayBalance }];
  }

  // Ordena todas as transações por data
  const sorted = [...transactions].sort((a, b) => {
    const dateA = a?.date ? new Date(a.date).getTime() : 0;
    const dateB = b?.date ? new Date(b.date).getTime() : 0;
    return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
  });

  // Filtra apenas as transações da conta selecionada (ou todas se for 'all')
  const txsDaConta = sorted.filter(t => selectedAccountId === 'all' || t.accountId === Number(selectedAccountId));

  let runningBalance = displayBalance;

  // Anda para trás para achar o ponto de partida do saldo
  txsDaConta.forEach((t) => {
    if (t.type === 1) runningBalance -= t.amount;
    else runningBalance += t.amount;
  });

  // Reconstrói a linha do tempo do saldo daquela conta
  return txsDaConta.map((t) => {
    if (t.type === 1) runningBalance += t.amount;
    else runningBalance -= t.amount;

    return {
      date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      balance: runningBalance
    };
  });
})();


  const mockChartData = (() => {
    if (selectedAccountId === 'all') {
      return [
        { name: 'Total Acumulado', Incomes: data.totalIncomes, Expenses: data.totalExpenses }
      ];
    }

    let incomesDaConta = 0;
    let expensesDaConta = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 1) {
        incomesDaConta += t.amount; 
      } else {
        expensesDaConta += t.amount; 
      }
    });

    return [
      { name: 'Total Acumulado', Incomes: incomesDaConta, Expenses: expensesDaConta }
    ];
  })();

  if (loading && transactions.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando painel...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('@FinanceApp:token');
    sessionStorage.removeItem('@FinanceApp:token');
    if (api.defaults.headers.common['Authorization']) {
      delete api.defaults.headers.common['Authorization'];
    }
    toast.info('Sessão encerrada. Redirecionando...');
    window.location.href = '/login'; 
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Menu de Navegação Superior */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
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

      {activeTab === 'dashboard' ? (
        <>
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>Dashboard Financeiro</h1>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Visão geral das suas finanças</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsAccountModalOpen(true)}
                style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                + Nova Conta
              </button>

              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                style={{ padding: '12px 24px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                + Nova Categoria
              </button>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                + Nova Transação
              </button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #007bff' }}>
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>SALDO ATUAL</span>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: displayBalance >= 0 ? '#333' : '#dc3545' }}>
                R$ {displayBalance.toFixed(2)}
              </h2>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #28a745' }}>
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>RECEITAS (ENTRADAS)</span>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#28a745' }}>
                R$ {selectedAccountId === 'all' ? data.totalIncomes.toFixed(2) : mockChartData[0].Incomes.toFixed(2)}
              </h2>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #dc3545' }}>
              <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>DESPESAS (SAÍDAS)</span>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#dc3545' }}>
                R$ {selectedAccountId === 'all' ? data.totalExpenses.toFixed(2) : mockChartData[0].Expenses.toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Filtros de Extrato: Conta e Período */}
<div style={{ backgroundColor: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
  
  {/* Filtro de Conta */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Conta:</label>
    <select 
      value={selectedAccountId} 
      onChange={(e) => setSelectedAccountId(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '200px' }}
    >
      <option value="all">Todas as Contas (Geral)</option>
      {accounts.map(acc => (
        <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
      ))}
    </select>
  </div>

  {/* FILTRO DE MÊS */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Mês:</label>
    <select 
      value={selectedMonth} 
      onChange={(e) => setSelectedMonth(Number(e.target.value))}
      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
    >
      <option value={0}>Janeiro</option>
      <option value={1}>Fevereiro</option>
      <option value={2}>Março</option>
      <option value={3}>Abril</option>
      <option value={4}>Maio</option>
      <option value={5}>Junho</option>
      <option value={6}>Julho</option>
      <option value={7}>Agosto</option>
      <option value={8}>Setembro</option>
      <option value={9}>Outubro</option>
      <option value={10}>Novembro</option>
      <option value={11}>Dezembro</option>
    </select>
  </div>

  {/* FILTRO DE ANO */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <label style={{ fontWeight: 'bold', color: '#555', fontSize: '14px' }}>Ano:</label>
    <select 
      value={selectedYear} 
      onChange={(e) => setSelectedYear(Number(e.target.value))}
      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
    >
      <option value={2025}>2025</option>
      <option value={2026}>2026</option>
      <option value={2027}>2027</option>
    </select>
  </div>
 
  {/* Botão de editar conta (Alinhado ao final) */}
  {selectedAccountId !== 'all' && (
    <button
      onClick={() => {
        const accountToEdit = accounts.find(a => String(a.id) === String(selectedAccountId));
        if (accountToEdit) setEditingAccount(accountToEdit);
      }}
      style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginLeft: 'auto' }}
      title="Editar esta conta"
    >
      ✏️ Editar Conta
    </button>
  )}
</div>

          {/* Seção dos Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            
            {/* Gráfico 1: Barras */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Proporção de Entradas vs Saídas</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Bar dataKey="Incomes" name="Receitas" fill="#28a745" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" name="Despesas" fill="#dc3545" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Linha de Tendência */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Tendência de Saldo</h3>
              {!filteredTrendData || filteredTrendData.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '120px 0' }}>Nenhum dado de saldo encontrado para o período.</p>
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Certifique-se de que o data do LineChart está puxando filteredTrendData */}
                    <LineChart data={filteredTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" stroke="#888888" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
                      <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Saldo']} />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#007bff" 
                        strokeWidth={3} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* TABELA DE HISTÓRICO DE TRANSAÇÕES SEMÂNTICA */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Últimas Transações</h3>
            
            {filteredTransactions.length === 0 ? (
              <p style={{ color: '#666' }}>Nenhuma transação cadastrada ainda.</p>
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
                      <tr key={t.id} style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px', color: '#555', fontSize: '14px', whiteSpace: 'nowrap' }}>
                          {formatDate(t.date || (t as any).Date)}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                          {t.description}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            backgroundColor: '#e9ecef', color: '#495057', padding: '4px 10px', 
                            borderRadius: '20px', fontSize: '12px', fontWeight: '500', display: 'inline-block' 
                          }}>
                            🏷️ {getCategoryName(t.categoryId || (t as any).CategoryId)}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '14px 16px', color: t.type === 1 ? '#28a745' : '#dc3545', 
                          fontWeight: 'bold', fontSize: '15px', textAlign: 'right', whiteSpace: 'nowrap' 
                        }}>
                          {t.type === 1 ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => setEditingTransaction(t)} 
                              style={{ padding: '6px 12px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#212529' }}
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              Excluir
                            </button>
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
        /* TELA DE PERFIL */
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
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #fafafa' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>E-mail:</span>
              <span style={{ color: '#333' }}>{profile.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #fafafa' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>Membro desde:</span>
              <span style={{ color: '#333' }}>{profile.memberSince}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #fafafa' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>Contas Bancárias Ativas:</span>
              <span style={{ color: '#007bff', fontWeight: 'bold' }}>{profile.totalAccountsCount} cadastradas</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>Total de Transações:</span>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>{transactions.length} movimentações</span>
            </div>
          </div>

          <button 
            onClick={() => alert('Configurações adicionais indisponíveis no momento.')}
            style={{ marginTop: '30px', width: '100%', padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Configurações da Conta
          </button>
          <button 
            onClick={handleLogout}
            style={{ marginTop: '12px', width: '100%', padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            🚪 Sair da Conta (Logout)
          </button>
        </div>
      )}

      {/* MODAIS FLUTUANTES */}
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

      {isCategoryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px' }}>
            <button onClick={() => setIsCategoryModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
            <h3 style={{ marginTop: 0 }}>Adicionar Nova Categoria</h3>
            <input 
              id="new-category-name"
              type="text" 
              placeholder="Ex: Combustível, Streaming..." 
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
            <button 
              onClick={async () => {
                const input = document.getElementById('new-category-name') as HTMLInputElement;
                if (!input.value.trim()) return toast.warning('Digite o nome da categoria');
                try {
                  await api.post('/categories', { name: input.value.trim() });
                  toast.success('Categoria adicionada! 🏷️');
                  setIsCategoryModalOpen(false);
                  loadDashboardData(); 
                } catch (err) {
                  toast.error('Erro ao salvar categoria');
                }
              }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Salvar Categoria
            </button>
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