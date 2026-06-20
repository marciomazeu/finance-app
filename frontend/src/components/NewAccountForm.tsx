import React, { useState } from 'react';
import { api } from '../api';
import { toast } from 'react-toastify';

interface NewAccountFormProps {
  onSave: () => void;
}

export const NewAccountForm: React.FC<NewAccountFormProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('O nome da conta é obrigatório.');
      return;
    }

    if (!balance || isNaN(Number(balance))) {
      toast.error('Insira um saldo inicial válido.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Envia os dados para a rota do seu backend C# (geralmente /accounts ou /api/accounts)
      await api.post('/accounts', {
        name: name.trim(),
        balance: Number(balance)
      });

      // Limpa os campos após o sucesso
      setName('');
      setBalance('');
      
      // Dispara a função do Dashboard para fechar o modal e atualizar os dados
      onSave();
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar a conta no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Adicionar Nova Conta</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Nome da Conta</label>
        <input
          type="text"
          placeholder="Ex: Carteira, Banco Itaú, Nubank"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>Saldo Inicial (R$)</label>
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
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
        {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
      </button>
    </form>
  );
};