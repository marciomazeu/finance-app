import { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // 2. Inicialize o navegador de rotas

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Altere o endpoint '/auth/login' para o caminho exato do seu controller do .NET
     const response = await api.post('/Auth/login', { email, password });
      
      const { token, refreshToken } = response.data;

      // Salvamos o token no navegador para não deslogar ao dar F5
      localStorage.setItem('@FinanceApp:token', token);
      localStorage.setItem('refreshToken', refreshToken);
      //localStorage.setItem('@FinanceApp:user', JSON.stringify(user));

      // 5. Manda o usuário para a página principal
      navigate('/dashboard');

      //alert('Login realizado com sucesso! Vamos para o Dashboard.');
      // Próximo passo será redirecionar para o dashboard aqui
    } catch (err: any) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Minhas Finanças
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entre para gerenciar seus gastos
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}