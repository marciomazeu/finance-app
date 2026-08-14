import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { userService } from '../api/userService';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Carrega as informações do usuário vindas do C#
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const data = await userService.getProfile();
        setName(data.name);
        setEmail(data.email);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast.error('Erro ao carregar dados do perfil ❌');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Atualiza nome e e-mail
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return toast.warning('Nome e E-mail não podem ficar vazios.');
    }

    try {
      setLoading(true);
      await userService.updateProfile({ name: name.trim(), email: email.trim() });
      toast.success('Informações atualizadas com sucesso! 👤');
    } catch (error: any) {
      toast.error(error.response?.data || 'Erro ao atualizar informações.');
    } finally {
      setLoading(false);
    }
  };

  // Altera a senha do usuário
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.warning('Preencha todos os campos de senha.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('A nova senha e a confirmação não coincidem.');
    }

    try {
      setLoading(true);
      await userService.changePassword({ currentPassword, newPassword });
      toast.success('Senha alterada com sucesso! 🔒');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data || 'Erro ao alterar senha. Verifique a senha atual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <Link 
  to="/dashboard" 
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#6c757d', // Cor cinza neutra
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '20px', // Dá um espaço para o conteúdo de baixo
    transition: 'background-color 0.2s',
    cursor: 'pointer'
  }}
  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
>
  ⬅️ Voltar para o Painel
</Link>
      <h2>Meu Perfil</h2>
      

      <p style={{ color: '#666', marginBottom: '24px' }}>Gerencie suas informações pessoais e configurações de segurança.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* INFORMAÇÕES PESSOAIS */}
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>Informações Pessoais</h3>
          <form onSubmit={handleUpdateInfo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Nome Completo:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>E-mail:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px' }}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </section>

        {/* ALTERAR SENHA */}
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>Segurança</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Senha Atual:</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Nova Senha:</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Confirmar Nova Senha:</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px' }}
            >
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
};