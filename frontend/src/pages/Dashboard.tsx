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
  type: number; // 1 = Inflow, 2 = Outflow
  date: string;
  accountId: number;
  categoryId: number;
}

interface DashboardData {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
}

// Interface para os pontos do gráfico de linha
interface BalanceTrendItem {
  date: string;
  balance: number;
}

interface AccountItem {
  id: number;
  name: string;
  balance: number;
}

// Interface para os dados do perfil (adicione no topo com as outras)
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

  // Dentro do componente Dashboard, junto com os outros states:
const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
const [profile, setProfile] = useState<UserProfile>({
  name: 'Márcio Mazeu',
  email: 'marcio@email.com', // Substitua depois pelo dado dinâmico do seu login/auth se tiver
  memberSince: 'Janeiro de 2026',
  totalAccountsCount: 0
});
  
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [trendData, setTrendData] = useState<BalanceTrendItem[]>([]); // ESTADO NOVO PARA O GRÁFICO
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  const loadDashboardData = async () => {
  try {
    setLoading(true);
    
    // 1. CAPTURA O TOKEN DO STORAGE E INJETA DIRETO NA INSTÂNCIA DA API
    const token = localStorage.getItem('@FinanceApp:token') || sessionStorage.getItem('@FinanceApp:token');
    if (token) {
      // Força o token no header global da sua instância 'api'
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn("Nenhum token encontrado no localStorage ou sessionStorage!");
    }
    
    // 2. Busca os dados de resumo dos cards (Sua chamada antiga continua aqui)
    const responseSummary = await api.get<any>('/transactions/dashboard'); 
    const totalBalance = responseSummary.data.balance ?? responseSummary.data.Balance ?? 0;
    
    setData({
      totalIncomes: responseSummary.data.totalIncomes ?? responseSummary.data.TotalIncomes ?? 0,
      totalExpenses: responseSummary.data.totalExpenses ?? responseSummary.data.TotalExpenses ?? 0,
      balance: totalBalance
    });

    // 2. BUSCA AS CONTAS TRATANDO PASCALCASE DO C# (Ajustado)
    try {
      const responseAccounts = await api.get<any[]>('/accounts'); // ⚠️ Se quebrar, teste mudar para '/api/accounts'
      
      console.log("CONTAS VINDAS DO BACKEND:", responseAccounts.data); // <-- Monitore no F12

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
      console.error("Erro específico ao buscar contas. Verifique se a rota existe no C#:", accError);
      setAccounts([]);
    }

    try {
      const responseCategories = await api.get<any[]>('/categories'); // Ou '/api/categories' dependendo do seu C#
      if (Array.isArray(responseCategories.data)) {
        const formattedCategories = responseCategories.data.map((cat: any) => ({
          id: cat.id ?? cat.Id ?? 0,
          name: cat.name ?? cat.Name ?? 'Geral'
        }));
        setCategories(formattedCategories);
      } else {
        setCategories([{ id: 1, name: 'Geral' }]); // Fallback padrão
      }
    } catch (catError) {
      console.error("Erro ao buscar categorias do backend:", catError);
      setCategories([{ id: 1, name: 'Geral' }]);
    }

    // 3. Busca a lista de transações
    const responseTransactions = await api.get<TransactionItem[]>('/transactions');
    const transactionsList = responseTransactions.data || [];
    setTransactions(transactionsList);

    // 4. CÁLCULO DO SALDO ACUMULADO EM TEMPO REAL PARA O GRÁFICO
    if (Array.isArray(transactionsList) && transactionsList.length > 0) {
      const sortedTransactions = [...transactionsList].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let runningBalance = totalBalance;
      sortedTransactions.forEach((t) => {
        if (t.type === 1) runningBalance -= t.amount;
        else runningBalance += t.amount;
      });

      const formattedTrend = sortedTransactions.map((t) => {
        if (t.type === 1) runningBalance += t.amount;
        else runningBalance -= t.amount;

        return {
          date: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          balance: runningBalance,
          accountId: t.accountId ?? t.accountId
        };
      });

      setTrendData(formattedTrend);
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

  {/* funcoes de filtro*/}
  // 1º: Primeiro, filtre as transações e ordene os dados base do estado
const filteredTransactions = selectedAccountId === 'all'
  ? transactions
  : transactions.filter(t => t.accountId === Number(selectedAccountId));

const filteredTrendData = selectedAccountId === 'all'
  ? trendData
  : trendData.filter((t: any) => t.accountId === Number(selectedAccountId));

const activeAccount = accounts.find(a => a.id === Number(selectedAccountId));
const displayBalance = selectedAccountId === 'all' ? data.balance : (activeAccount?.balance ?? 0);

  // CÁLCULO DINÂMICO PARA O GRÁFICO DE BARRAS
const mockChartData = (() => {
  // Se for "Todas as Contas", usa o total geral que veio da API
  if (selectedAccountId === 'all') {
    return [
      { name: 'Total Acumulado', Incomes: data.totalIncomes, Expenses: data.totalExpenses }
    ];
  }

  // Se for uma conta específica, soma apenas as transações dela que estão na tela
  let incomesDaConta = 0;
  let expensesDaConta = 0;

  filteredTransactions.forEach(t => {
    if (t.type === 1) {
      incomesDaConta += t.amount; // 1 = Entrada (Receita)
    } else {
      expensesDaConta += t.amount; // 2 = Saída (Despesa)
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
  // 1. Remove o token inválido do navegador
  localStorage.removeItem('@FinanceApp:token');
  sessionStorage.removeItem('@FinanceApp:token');

  // 2. Remove o header do Axios para não enviar lixo nas próximas requisições
  if (api.defaults.headers.common['Authorization']) {
    delete api.defaults.headers.common['Authorization'];
  }

  toast.info('Sessão encerrada. Redirecionando...');

  // 3. Redireciona o usuário para a tela de login
  // Se você usa React Router:
  // navigate('/login');
  
  // Se não usa rotas complexas, o recarregamento resolve voltando para a raiz:
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
          // Atualiza a contagem de contas do perfil em tempo real ao clicar
          setProfile(prev => ({ ...prev, totalAccountsCount: accounts.length }));
        }}
        style={{ background: 'none', border: 'none', padding: '10px', fontSize: '16px', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', color: activeTab === 'profile' ? '#007bff' : '#666', borderBottom: activeTab === 'profile' ? '3px solid #007bff' : 'none', cursor: 'pointer' }}
      >
        Meu Perfil
      </button>
    </div>
    {activeTab === 'dashboard' ? (
  <>
    {/* TODO O SEU CÓDIGO ANTIGO DO DASHBOARD FICA AQUI DENTRO (Do Cabeçalho até a lista de transações) */}
 {/* Cabeçalho */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
  <div>
    <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>Dashboard Financeiro</h1>
    <p style={{ margin: '5px 0 0 0', color: '#666' }}>Visão geral das suas finanças</p>
  </div>
  
  {/* Container para agrupar os botões lado a lado */}
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
          <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>SALDO ATUAL TOTAL</span>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: displayBalance >= 0 ? '#333' : '#dc3545' }}>
            R$ {displayBalance.toFixed(2)}
          </h2>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #28a745' }}>
          <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>RECEITAS (ENTRADAS)</span>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#28a745' }}>
            R$ {displayBalance.toFixed(2)}
          </h2>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '5px solid #dc3545' }}>
          <span style={{ fontSize: '14px', color: '#888', fontWeight: 'bold' }}>DESPESAS (SAÍDAS)</span>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#dc3545' }}>
            R$ {data.totalExpenses.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* Filtro de Extrato por Conta */}
      <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#555' }}>Filtrar Extrato por Conta:</label>
        <select 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', minWidth: '200px' }}
        >
          <option value="all">Visualizar Todas as Contas (Geral)</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toFixed(2)})</option>
          ))}
        </select>
       
        {/* BOTÃO PARA EDITAR A CONTA SELECIONADA */}
        {selectedAccountId !== 'all' && (
          <button
            onClick={() => {
              // Usamos == em vez de === para evitar problemas se um for string e o outro number
              const accountToEdit = accounts.find(a => String(a.id) == String(selectedAccountId));
              if (accountToEdit) {
                setEditingAccount(accountToEdit);
              } else {
                console.log("Conta não encontrada no array para edição. ID buscado:", selectedAccountId);
              }
            }}
            style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
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

        {/* Gráfico 2: Linha de Tendência - CORRIGIDO */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Tendência de Saldo</h3>
          
          {!trendData || trendData.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '120px 0' }}>Nenhum dado de saldo encontrado para o período.</p>
          ) : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
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

      {/* Lista de Últimas Transações */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Últimas Transações</h3>
        
        {filteredTransactions.length === 0 ? (
          <p style={{ color: '#666' }}>Nenhuma transação cadastrada ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTransactions.map((t) => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', border: '1px solid #eee', borderRadius: '6px',
                backgroundColor: '#fafafa'
              }}>
                <div>
                  <strong style={{ color: '#333' }}>{t.description}</strong>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <strong style={{ color: t.type === 1 ? '#28a745' : '#dc3545', fontSize: '16px' }}>
                    {t.type === 1 ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </strong>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => setEditingTransaction(t)} 
                      style={{ padding: '4px 8px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteTransaction(t.id)}
                      style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  </>
) : (
     /* ---------------------------------------------------- */
  /* TELA DE PERFIL (SÓ APARECE SE ACTIVE TAB FOR 'PROFILE') */
  /* ---------------------------------------------------- */
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
      onClick={() => {
        alert('Funcionalidade de edição ou logout pode ser integrada aqui!');
      }}
      style={{ marginTop: '30px', width: '100%', padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
    >
      Configurações da Conta
    </button>
    <button 
  onClick={handleLogout}
  style={{ 
    marginTop: '30px', 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#dc3545', // Cor vermelha de atenção
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    fontSize: '15px'
  }}
>
  🚪 Sair da Conta (Logout)
</button>
  </div>
)}

      {/* MODAIS FLUTUANTES */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
            boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px'
          }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
            >
              ✕
            </button>
            <NewTransactionForm onSave={handleTransactionSaved} />
          </div>
        </div>
      )}

      {editingTransaction && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
            boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px'
          }}>
            <button 
              onClick={() => setEditingTransaction(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
            >
              ✕
            </button>

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

{/* MODAL FLUTUANTE DE NOVA CONTA */}
{isAccountModalOpen && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  }}>
    <div style={{
      backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
      boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px'
    }}>
      <button 
        onClick={() => setIsAccountModalOpen(false)}
        style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
      >
        ✕
      </button>
      
      {/* Insira aqui o seu componente de formulário de conta */}
      {/* Exemplo: <NewAccountForm onSave={() => { setIsAccountModalOpen(false); loadDashboardData(); }} /> */}
      <NewAccountForm 
        onSave={() => { 
          setIsAccountModalOpen(false); // Fecha o modal após salvar
          loadDashboardData();          // Recarrega o dashboard (para atualizar os selects de conta se necessário)
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
      
      {/* Formulário Simples inline */}
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
            loadDashboardData(); // Recarrega para atualizar os selects
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

    {/* MODAL FLUTUANTE DE EDITAR CONTA */}
    {editingAccount && (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0px 4px 15px rgba(0,0,0,0.3)', position: 'relative', minWidth: '380px' }}>
          <button onClick={() => setEditingAccount(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
          
          <EditAccountForm 
            account={editingAccount} 
            onSave={() => {
              setEditingAccount(null);
              loadDashboardData(); // Recarrega os dados atualizados do backend
            }} 
          />
        </div>
      </div>
    )}
    </div>

    
  );
}