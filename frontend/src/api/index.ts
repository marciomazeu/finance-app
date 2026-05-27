import axios from 'axios';

export const api = axios.create({
  // Atualizado para a porta real da sua API .NET
  baseURL: 'http://localhost:5211/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// O restante do arquivo (interceptors) pode continuar exatamente igual
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@FinanceApp:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});