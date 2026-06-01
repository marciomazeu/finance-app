import { Login } from './pages/Login';
import Dashboard from './pages/Dashboard'; // <-- Importe o novo componente
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // <-- Importe o componente

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública: Qualquer um pode acessar */}
        <Route path="/" element={<Login />} />
        
        {/* Rotas Protegidas: Só acessa quem passar pelo filtro do ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        
        {/* Redireciona qualquer rota inválida para o login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

