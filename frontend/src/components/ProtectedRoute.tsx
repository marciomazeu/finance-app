import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Busca o token que guardamos no momento do login
  const token = localStorage.getItem('@FinanceApp:token');

  // Se NÃO existir token, redireciona o usuário para a página de login "/"
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Se o token existir, renderiza a página que o usuário tentou acessar
  return <Outlet />;
}