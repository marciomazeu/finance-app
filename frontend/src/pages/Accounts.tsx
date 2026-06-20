import React, { useEffect, useState } from 'react';
import { accountService, type AccountResponse } from '../api/accountService';

export const Accounts: React.FC = () => {
  // Mantemos inicializado como array vazio por segurança
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      
      console.log("O que o service de contas retornou:", data);

      // CORREÇÃO CRUCIAL: Verifica se o dado retornado é de fato um array.
      // Se não for (objeto envelopado ou resposta com .data), tenta extrair ou joga array vazio.
      if (Array.isArray(data)) {
        setAccounts(data);
      } else if (data && typeof data === 'object' && Array.isArray((data as any).accounts)) {
        setAccounts((data as any).accounts);
      } else if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
        setAccounts((data as any).data);
      } else {
        setAccounts([]); // Fallback para evitar o crash do .map
      }
      
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
      setAccounts([]); // Evita que o estado fique inválido em caso de erro de rede
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return alert('Preencha todos os campos');

    try {
      setLoading(true);
      
      if (editingId) {
        await accountService.update(editingId, { name, balance: parseFloat(balance) });
        alert('Conta atualizada com sucesso!');
      } else {
        await accountService.create({ name, balance: parseFloat(balance) });
        alert('Conta criada com sucesso!');
      }
      
      setName('');
      setBalance('');
      setEditingId(null);
      loadAccounts();
    } catch (error: any) {
      alert(error.response?.data || 'Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (account: AccountResponse) => {
    setEditingId(account.id);
    setName(account.name);
    setBalance(account.balance.toString());
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta conta?')) return;

    try {
      await accountService.delete(id);
      alert('Conta deletada com sucesso!');
      loadAccounts();
    } catch (error: any) {
      alert(error.response?.data || 'Erro ao deletar conta');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setBalance('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Minhas Contas</h2>

      {/* Lista de Contas */}
      <div style={{ display: 'grid', gap: '10px', marginBottom: '30px' }}>
        {/* CORREÇÃO VISUAL: Validamos explicitamente se 'accounts' é uma lista antes de rodar o map */}
        {!Array.isArray(accounts) || accounts.length === 0 ? (
          <p>Nenhuma conta cadastrada.</p>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{acc.name}</strong>
                {/* Fallback caso balance venha como nulo do banco */}
                <div style={{ fontSize: '14px', color: '#666' }}>
                  R$ {typeof acc.balance === 'number' ? acc.balance.toFixed(2) : '0.00'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEditClick(acc)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={() => handleDeleteClick(acc.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <hr />

      {/* Formulário único Dinâmico */}
      <h3>{editingId ? 'Editar Conta' : 'Nova Conta'}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="Nome da Conta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Saldo (R$)"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', backgroundColor: editingId ? '#28a745' : '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Adicionar Conta'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};