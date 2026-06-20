import React, { useEffect, useState } from 'react';
import { accountService, type AccountResponse } from '../api/accountService';
import { categoryService, type CategoryResponse } from '../api/categoryService';
import { transactionService } from '../api/transactionService';

interface TransactionItem {
  id: number;
  description: string;
  amount: number;
  type: number; // 1 = Inflow, 2 = Outflow
  date: string;
  accountId: number;
  categoryId: number;
}

interface EditTransactionFormProps {
  transaction: TransactionItem;
  onSave: () => void;
}

// Função auxiliar para garantir que os dados recebidos sejam convertidos em Arrays válidos
const ensureArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.accounts)) return data.accounts;
    if (Array.isArray(data.categories)) return data.categories;
  }
  return [];
};

export const EditTransactionForm: React.FC<EditTransactionFormProps> = ({ transaction, onSave }) => {
  // Dados vindos do Banco inicializados como Arrays vazios
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // Estados do Formulário carregando os dados da transação selecionada
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<'Inflow' | 'Outflow'>(transaction.type === 1 ? 'Inflow' : 'Outflow');
  const [accountId, setAccountId] = useState(transaction.accountId.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId.toString());
  const [loading, setLoading] = useState(false);

  // Carrega as opções de Contas e Categorias
  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          accountService.getAll(),
          categoryService.getAll(),
        ]);
        
        // CORREÇÃO: Tratando as respostas com o ensureArray antes de salvar no estado
        setAccounts(ensureArray(accountsData));
        setCategories(ensureArray(categoriesData));
      } catch (error) {
        console.error('Erro ao carregar dados no formulário de edição:', error);
        alert('Erro ao carregar opções do formulário.');
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !accountId || !categoryId) {
      return alert('Por favor, preencha todos os campos.');
    }

    try {
      setLoading(true);
      
      // Envia os dados atualizados para a API
      await transactionService.update(transaction.id, {
        description,
        amount: parseFloat(amount),
        type: type === 'Inflow' ? 1 : 2, // Converte de volta para os Enums corretos do C# (Inflow=1, Outflow=2)
        accountId: parseInt(accountId),
        categoryId: parseInt(categoryId),
        date: transaction.date // Mantém a data original da transação
      });

      onSave(); // Fecha o modal e atualiza o Dashboard
    } catch (error: any) {
      alert(error.response?.data || 'Erro ao atualizar transação ❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
      <h3>Editar Transação</h3>

      <input
        type="text"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ padding: '8px' }}
      />

      <input
        type="number"
        step="0.01"
        placeholder="Valor (R$)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ padding: '8px' }}
      />

      <select value={type} onChange={(e) => setType(e.target.value as 'Inflow' | 'Outflow')} style={{ padding: '8px' }}>
        <option value="Outflow">Despesa (Saída)</option>
        <option value="Inflow">Receita (Entrada)</option>
      </select>

      {/* SELECT DE CONTAS - CORRIGIDO COM TRAVA DE SEGURANÇA */}
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ padding: '8px' }}>
        <option value="">Selecione a Conta</option>
        {Array.isArray(accounts) && accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name} (Saldo: R$ {typeof acc.balance === 'number' ? acc.balance.toFixed(2) : '0.00'})
          </option>
        ))}
      </select>

      {/* SELECT DE CATEGORIAS - CORRIGIDO COM TRAVA DE SEGURANÇA */}
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ padding: '8px' }}>
        <option value="">Selecione a Categoria</option>
        {Array.isArray(categories) && categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </form>
  );
};