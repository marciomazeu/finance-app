import { Login } from './pages/Login';
import Dashboard from './pages/Dashboard'; // <-- Importe o novo componente
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // <-- Importe o componente
import { Accounts } from './pages/Accounts';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Não esqueça do CSS!
import { Profile } from './pages/Profile';
import Investments from './pages/Investments';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública: Qualquer um pode acessar */}
        <Route path="/" element={<Login />} />
        
        {/* Bloco Único de Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contas" element={<Accounts />} />
          <Route path="/investments" element={<Investments />} />
        </Route>
        
        {/* Redireciona qualquer rota inválida para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<Profile />} />
        
      
      </Routes>
        {/* Adicione o container em qualquer lugar dentro do fragment principal */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        theme="colored"
      />
    </BrowserRouter>
  );
}

