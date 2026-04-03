// src/api.js
import axios from 'axios';

// Создаём экземпляр axios с базовым URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Используем переменную окружения или локальный сервер
  headers: { 'Content-Type': 'application/json' },
});

// Добавляем токен в каждый запрос, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ответов и ошибок
api.interceptors.response.use(
  (res) => res, // Возвращаем ответ как есть
  (err) => {
    // Если токен невалидный (401), удаляем его и редиректим на логин
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;