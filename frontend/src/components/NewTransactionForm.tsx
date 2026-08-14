import React, { useEffect, useState } from 'react';
import { accountService, type AccountResponse } from '../api/accountService';
import { categoryService, type CategoryResponse } from '../api/categoryService';
import { transactionService } from '../api/transactionService';
import { toast } from 'react-toastify';

interface NewTransactionFormProps {
  onSave: () => void;
}

const ensureArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.accounts)) return data.accounts;
    if (Array.isArray(data.categories)) return data.categories;
  }
  return [];
};

export const NewTransactionForm: React.FC<NewTransactionFormProps> = ({ onSave }) => {
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // Estados do Formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Inflow' | 'Outflow'>('Outflow');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Define a data de hoje como padrão estável
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(getTodayString());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          accountService.getAll(),
          categoryService.getAll(),
        ]);
        
        setAccounts(ensureArray(accountsData));
        setCategories(ensureArray(categoriesData));
      } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error);
        toast.error('Erro ao carregar dados de contas e categorias.');
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || !accountId || !categoryId || !date) {
      return toast.warning('Por favor, preencha todos os campos.');
    }

    try {
      setLoading(true);
      await transactionService.create({
        description: description.trim(),
        amount: parseFloat(amount),
        type: type === 'Inflow' ? 1 : 2, 
        accountId: parseInt(accountId),
        categoryId: parseInt(categoryId),
        date: date, // Envia a string "YYYY-MM-DD" escolhida pelo usuário
      });

      toast.success('Nova transação adicionada! 🚀');
      
      // Limpa os campos e reseta a data para o dia atual
      setDescription('');
      setAmount('');
      setAccountId('');
      setCategoryId('');
      setDate(getTodayString());
      
      onSave(); 
    } catch (error: any) {
      toast.error(error.response?.data || 'Erro ao salvar transação ❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Nova Transação</h3>

      <input
        type="text"
        placeholder="Descrição (ex: Mercado, Salário)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
      />

      <input
        type="number"
        step="0.01"
        placeholder="Valor (R$)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
      />

      <select 
        value={type} 
        onChange={(e) => setType(e.target.value as 'Inflow' | 'Outflow')} 
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
      >
        <option value="Outflow">Despesa (Saída)</option>
        <option value="Inflow">Receita (Entrada)</option>
      </select>

      {/* SELECT DE CONTAS */}
      <select 
        value={accountId} 
        onChange={(e) => setAccountId(e.target.value)} 
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
      >
        <option value="">Selecione a Conta</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name} (Saldo: R$ {typeof acc.balance === 'number' ? acc.balance.toFixed(2) : '0.00'})
          </option>
        ))}
      </select>

      {/* SELECT DE CATEGORIAS */}
      <select 
        value={categoryId} 
        onChange={(e) => setCategoryId(e.target.value)} 
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
      >
        <option value="">Selecione a Categoria</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* CONTAINER DO INPUT DE DATA ALINHADO COERENTEMENTE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>
          Data da Transação:
        </label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          style={{ 
            padding: '10px', 
            borderRadius: '4px', 
            border: '1px solid #ccc', 
            boxSizing: 'border-box',
            fontSize: '14px',
            fontFamily: 'inherit'
          }} 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}
      >
        {loading ? 'Salvando...' : 'Confirmar Transação'}
      </button>
    </form>
  );
};