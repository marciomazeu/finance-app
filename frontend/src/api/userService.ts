import axios from 'axios';

// 1. Atualizado com a sua porta correta (5211)
const api = axios.create({
  baseURL: 'http://localhost:5211/api', 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@FinanceApp:token'); 
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserProfileResponse {
  name: string;
  email: string;
}

export const userService = {
  // GET: http://localhost:5211/api/profile
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await api.get('/profile'); // Corrigido
    return response.data;
  },

  // PUT: http://localhost:5211/api/profile
  updateProfile: async (data: { name: string; email: string }): Promise<void> => {
    await api.put('/profile', data); // Corrigido
  },

  // PUT: http://localhost:5211/api/profile/change-password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/profile/change-password', data); // Corrigido
  }
};