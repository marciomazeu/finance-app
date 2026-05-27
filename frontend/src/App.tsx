import { Login } from './pages/Login';
import Dashboard from './pages/Dashboard'; // <-- Importe o novo componente
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial carrega a tela de login */}
        <Route path="/" element={<Login />} />
        
        {/* Nova rota do Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Redireciona qualquer rota inválida para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

