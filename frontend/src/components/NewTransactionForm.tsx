import React, { useEffect, useState } from 'react';
import { accountService, type AccountResponse } from '../api/accountService';
import { categoryService, type CategoryResponse } from '../api/categoryService';
import { transactionService } from '../api/transactionService';
import { toast } from 'react-toastify';

interface NewTransactionFormProps {
  onSave: () => void;
}

// Função auxiliar para tratar respostas do Axios que vêm envelopadas em objetos
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
  // Estados que guardam os dados vindos do Banco
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // Estados do Formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Inflow' | 'Outflow'>('Outflow');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  // Carrega as opções assim que o componente renderiza
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          accountService.getAll(),
          categoryService.getAll(),
        ]);
        
        const validAccounts = ensureArray(accountsData);
        const validCategories = ensureArray(categoriesData);

        setAccounts(validAccounts);
        setCategories(validCategories);
      } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error);
        toast.error('Erro ao carregar dados de contas e categorias.');
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || !accountId || !categoryId) {
      return toast.warning('Por favor, preencha todos os campos.');
    }

    try {
      setLoading(true);
      await transactionService.create({
        description: description.trim(),
        amount: parseFloat(amount),
        type: type === 'Inflow' ? 1 : 2, // 1 para Receita, 2 para Despesa
        accountId: parseInt(accountId),
        categoryId: parseInt(categoryId),
        date: new Date().toISOString(),
      });

      toast.success('Nova transação adicionada! 🚀');
      
      // Limpa o formulário
      setDescription('');
      setAmount('');
      setAccountId('');
      setCategoryId('');
      
      onSave(); // Atualiza o Dashboard
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
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      />

      <input
        type="number"
        step="0.01"
        placeholder="Valor (R$)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      />

      <select 
        value={type} 
        onChange={(e) => setType(e.target.value as 'Inflow' | 'Outflow')} 
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        <option value="Outflow">Despesa (Saída)</option>
        <option value="Inflow">Receita (Entrada)</option>
      </select>

      {/* SELECT DE CONTAS */}
      <select 
        value={accountId} 
        onChange={(e) => setAccountId(e.target.value)} 
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
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
        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        <option value="">Selecione a Categoria</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <button 
        type="submit" 
        disabled={loading} 
        style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Salvando...' : 'Confirmar Transação'}
      </button>
    </form>
  );
};