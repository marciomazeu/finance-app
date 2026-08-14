import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. IMPORTE O NAVIGATE

interface Investment {
  id: number;
  name: string;
  investedAmount: number;
  currentBalance: number;
  yieldAmount: number;
  yieldPercent: number;
}

interface Account {
  id: number;
  name: string;
}

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  //const [accounts, setAccounts] = useState<Account[]>([]);
  const navigate = useNavigate();
  
  // Estados dos formulários
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  //const [accountId, setAccountId] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState('');
  // Estados adicionais no topo do componente para controle de edição/aporte
const [contributionAmount, setContributionAmount] = useState('');
const [aportId, setAportId] = useState<number | null>(null);
const [editNameId, setEditNameId] = useState<number | null>(null);
const [newName, setNewName] = useState('');

const [isHistoryOpen, setIsHistoryOpen] = useState(false);
const [selectedInvestmentName, setSelectedInvestmentName] = useState('');
const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const token = localStorage.getItem('@FinanceApp:token');
  const api = axios.create({
    baseURL: 'http://localhost:5173/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    loadData();
  }, []);

 const loadData = async () => {
  const currentToken = localStorage.getItem('@FinanceApp:token');
  
  if (!currentToken) {
    console.error("Token não encontrado no localStorage.");
    return;
  }

  // Configuração explícita para evitar falhas globais do Axios
  const config = {
    headers: { Authorization: `Bearer ${currentToken}` }
  };

  // 1. Buscar Investimentos
  try {
    const resInvestments = await axios.get('http://localhost:5211/api/investments', config);
    if (Array.isArray(resInvestments.data)) {
      setInvestments(resInvestments.data);
    }
  } catch (err) {
    console.error("Erro ao buscar investimentos:", err);
  }

  // 2. Buscar Contas (Isolado para capturar o formato correto)
//   try {
//     const resAccounts = await axios.get('http://localhost:5211/api/accounts', config);
    
//     // Força a validação exata do tipo de retorno
//     if (resAccounts.data && Array.isArray(resAccounts.data)) {
//       setAccounts(resAccounts.data);
//     } else {
//       console.warn("Mapeamento alternativo para contas.");
//       setAccounts([]);
//     }
//   } catch (err) {
//     console.error("Erro ao buscar contas no endpoint /api/accounts:", err);
//     setAccounts([]);
//   }
};

  const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !amount) return alert("Preencha todos os campos");

  const currentToken = localStorage.getItem('@FinanceApp:token');
  if (!currentToken) return alert("Sessão expirada. Faça login novamente.");

  const config = {
    headers: { Authorization: `Bearer ${currentToken}` }
  };

  try {
    // Usando a URL absoluta para evitar que o Vite intercepte com 404
    await axios.post('http://localhost:5211/api/investments', {
      name,
      amount: parseFloat(amount)
    }, config);

    // Limpa o formulário após o sucesso
    setName('');
    setAmount('');
    
    // Atualiza a lista na tela
    loadData();
  } catch (err: any) {
    console.error("Erro ao criar investimento:", err.response?.data || err.message);
    alert(err.response?.data || "Erro ao criar investimento");
  }
};

  const handleUpdateBalance = async (id: number) => {
  if (!newBalance) return;
  
  const currentToken = localStorage.getItem('@FinanceApp:token');
  const config = {
    headers: { Authorization: `Bearer ${currentToken}` }
  };

  try {
    await axios.put(`http://localhost:5211/api/investments/${id}/balance`, {
      newBalance: parseFloat(newBalance)
    }, config);

    setEditingId(null);
    setNewBalance('');
    loadData();
  } catch (err) {
    alert("Erro ao atualizar saldo");
  }
};

// Função para enviar o aporte
const handleAddContribution = async (id: number) => {
  if (!contributionAmount) return;
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('@FinanceApp:token')}` } };
  
  try {
    await axios.put(`http://localhost:5211/api/investments/${id}/add-contribution`, {
      amount: parseFloat(contributionAmount)
    }, config);
    setAportId(null);
    setContributionAmount('');
    loadData();
  } catch (err) {
    alert("Erro ao realizar aporte");
  }
};

// Função para salvar edição de nome
const handleUpdateName = async (id: number) => {
  if (!newName) return;
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('@FinanceApp:token')}` } };
  
  try {
    // URL, Dados (Body), Configuração (Headers)
    await axios.put(`http://localhost:5211/api/investments/${id}`, { name: newName }, config);
    setEditNameId(null);
    setNewName('');
    loadData();
  } catch (err) {
    alert("Erro ao atualizar nome");
  }
};

// Função para deletar investimento
const handleDelete = async (id: number) => {
  if (!window.confirm("Tem certeza que deseja excluir este investimento?")) return;
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem('@FinanceApp:token')}` } };
  
  try {
    await axios.delete(`http://localhost:5211/api/investments/${id}`, config);
    loadData();
  } catch (err) {
    alert("Erro ao excluir investimento");
  }
};

//funcao para buscar o historico
const handleOpenHistory = async (id: number, name: string) => {
  const currentToken = localStorage.getItem('@FinanceApp:token'); // Ajuste para 'jwt' se o seu app usar esse nome
  const config = {
    headers: { Authorization: `Bearer ${currentToken}` }
  };

  try {
    setSelectedInvestmentName(name);
    const res = await axios.get(`http://localhost:5211/api/investments/${id}/history`, config);
    setHistoryLogs(res.data);
    setIsHistoryOpen(true);
  } catch (err) {
    alert("Erro ao carregar o histórico do investimento.");
  }
};

  return (
  <div style={{ 
    padding: '32px', 
    fontFamily: 'system-ui, -apple-system, sans-serif', 
    maxWidth: '1200px', 
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    minHeight: '100vh'
  }}>
    <h2 style={{ color: '#111827', marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
      📈 Acompanhamento de Investimentos
    </h2>
    {/* BOTÃO DE VOLTAR */}
        <button 
          onClick={() => navigate('/dashboard')} // Mude para a rota exata da sua dashboard se for diferente
          style={{
            padding: '10px 18px',
            backgroundColor: '#4b5563',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          ⬅️ Voltar para Dashboard
        </button>
    
    {/* Formulário de Cadastro - Agora quebra em linhas em telas menores */}
    <div style={{ 
      backgroundColor: '#ffffff', 
      padding: '24px', 
      borderRadius: '12px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '32px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151', fontSize: '18px' }}>Novo Investimento</h3>
      <form onSubmit={handleCreate} style={{ 
        display: 'flex', 
        flexWrap: 'wrap', // Garante que se a tela for pequena, ele quebra a linha em vez de esmagar
        gap: '16px', 
        alignItems: 'center'
      }}>
        <input 
          type="text" 
          placeholder="Nome (Ex: CDB 100% CDI)" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', flex: '2', minWidth: '200px', fontSize: '14px' }} 
        />
        <input 
          type="number" 
          step="0.01" 
          placeholder="Valor do Aporte (R$)" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', flex: '1', minWidth: '150px', fontSize: '14px' }} 
        />
        
        
        <button type="submit" style={{ 
          padding: '10px 20px', 
          backgroundColor: '#10b981', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          whiteSpace: 'nowrap'
        }}>
          Adicionar Investimento
        </button>
      </form>
    </div>

    {/* Grid de Cards - Organizado em colunas responsivas */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', // Cria colunas automáticas de no mínimo 320px
      gap: '24px' 
    }}>
      {investments.map(inv => {
  const isPositive = inv.yieldAmount >= 0;
  return (
    <div key={inv.id} style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '12px', 
      padding: '24px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      
      {/* Botão de Excluir no canto superior direito do Card */}
      <button 
        onClick={() => handleDelete(inv.id)}
        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
        title="Excluir Investimento"
      >
        🗑️
      </button>

      <div>
        {/* Modo Edição de Nome vs Visualização */}
        {editNameId === inv.id ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginRight: '24px' }}>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', width: '100%' }} />
            <button onClick={() => handleUpdateName(inv.id)} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
            <button onClick={() => setEditNameId(null)} style={{ padding: '4px 8px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>X</button>
          </div>
        ) : (
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {inv.name}
            <button onClick={() => { setEditNameId(inv.id); setNewName(inv.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
          </h3>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '14px', color: '#4b5563' }}>
          <span>Total Aplicado:</span>
          <strong>R$ {inv.investedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '14px', color: '#4b5563' }}>
          <span>Saldo Atual:</span>
          <strong>R$ {inv.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          borderRadius: '8px', 
          backgroundColor: isPositive ? '#ecfdf5' : '#fef2f2', 
          color: isPositive ? '#065f46' : '#991b1b', 
          fontWeight: '600',
          fontSize: '15px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Rendimento:</span>
          <span>R$ {inv.yieldAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({inv.yieldPercent.toFixed(2)}%)</span>
        </div>
      </div>

      {/* Ações do Card: Atualizar Saldo e Aporte */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #f3f4f6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Sub-interface: Atualizar Saldo Atual */}
        {editingId === inv.id ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" step="0.01" placeholder="Novo Saldo" value={newBalance} onChange={e => setNewBalance(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%' }} />
            <button onClick={() => handleUpdateBalance(inv.id)} style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Salvar</button>
            <button onClick={() => setEditingId(null)} style={{ padding: '8px', backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>X</button>
          </div>
        ) : aportId === inv.id ? (
          /* Sub-interface: Inserir Aporte */
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="number" step="0.01" placeholder="Valor do Aporte" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%' }} />
            <button onClick={() => handleAddContribution(inv.id)} style={{ padding: '8px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Aportar</button>
            <button onClick={() => setAportId(null)} style={{ padding: '8px', backgroundColor: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>X</button>
          </div>
        ) : (
            
          /* Botões Padrão de Ação */
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Botão de Histórico adicionado ao corpo do Card */}
<button 
  onClick={() => handleOpenHistory(inv.id, inv.name)}
  style={{
    width: '100%',
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
    fontWeight: '500',
    fontSize: '13px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  }}
>
  📋 Ver Histórico / Extrato
</button>
            <button onClick={() => { setEditingId(inv.id); setAportId(null); setNewBalance(inv.currentBalance.toString()); }} style={{ flex: 1, padding: '8px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#4b5563', fontWeight: '500', fontSize: '13px' }}>
              🔄 Atualizar Saldo
            </button>
            <button onClick={() => { setAportId(inv.id); setEditingId(null); }} style={{ flex: 1, padding: '8px', backgroundColor: '#e0f2fe', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', fontWeight: '500', fontSize: '13px' }}>
              💰 Novo Aporte
            </button>
          </div>
        )}
      </div>
      {/* MODAL DE HISTÓRICO */}
{isHistoryOpen && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000
  }}>
    <div style={{
      backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
      width: '100%', maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Extrato: {selectedInvestmentName}</h3>
        <button onClick={() => setIsHistoryOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>&times;</button>
      </div>

      {historyLogs.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '24px 0' }}>Nenhuma movimentação registrada ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historyLogs.map((log: any) => {
            const isAporte = log.type === "Aporte";
            const isPositiveYield = log.difference >= 0;

            return (
              <div key={log.id} style={{
                padding: '12px 16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${isAporte ? '#10b981' : (isPositiveYield ? '#3b82f6' : '#ef4444')}`,
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    {isAporte ? '💰 Aporte Financeiro' : '🔄 Atualização de Saldo'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Variação:</span>
                  <strong style={{ color: isAporte || isPositiveYield ? '#047857' : '#b91c1c' }}>
                    {log.difference >= 0 ? '+' : ''}R$ {log.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span>Saldo:</span>
                  <span>R$ {log.previousAmount.toLocaleString('pt-BR')} ➡️ R$ {log.newAmount.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button 
        onClick={() => setIsHistoryOpen(false)}
        style={{
          width: '100%', marginTop: '24px', padding: '10px',
          backgroundColor: '#4b5563', color: '#fff', border: 'none',
          borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
        }}
      >
        Fechar Extrato
      </button>
    </div>
  </div>
)}
    </div>
  );
})}
    </div>
  </div>
);
}