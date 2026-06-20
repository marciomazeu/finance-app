import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from 'react-toastify';

interface AccountItem {
  id: number;
  name: string;
  balance: number;
}

interface EditAccountFormProps {
  account: AccountItem;
  onSave: () => void;
}

export const EditAccountForm: React.FC<EditAccountFormProps> = ({ account, onSave }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preenche os campos assim que o modal abre com a conta selecionada
  useEffect(() => {
    if (account) {
      setName(account.name);
      setBalance(account.balance.toString());
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('O nome da conta é obrigatório.');
      return;
    }

    if (!balance || isNaN(Number(balance))) {
      toast.error('Insira um saldo válido.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Envia a atualização para o backend C# passando o ID na URL
      await api.put(`/accounts/${account.id}`, {
        id: account.id,
        name: name.trim(),
        balance: Number(balance)
      });

      toast.success('Conta atualizada com sucesso! 💳');
      onSave(); // Fecha o modal e atualiza os dados
    } catch (error: any) {
      console.error('Erro ao atualizar conta:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar a conta no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Editar Conta</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nome da Conta</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Saldo (R$)</label>
        <input
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          disabled={isSubmitting}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '12px',
          backgroundColor: isSubmitting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          marginTop: '10px'
        }}
      >
        {isSubmitting ? 'Salvando...' : 'Atualizar Conta'}
      </button>
    </form>
  );
};