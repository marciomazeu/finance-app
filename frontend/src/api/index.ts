import axios from 'axios';

export const api = axios.create({
  // Atualizado para a porta real da sua API .NET
  baseURL: 'http://localhost:5211/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Adiciona o Token JWT em toda requisição automaticamente
api.interceptors.request.use(
  (config) => {
    // Busca o token do localstorage (ajuste o nome se no seu projeto for diferente, ex: 'token')
    const token = localStorage.getItem('@FinanceApp:token') || sessionStorage.getItem('@FinanceApp:token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


