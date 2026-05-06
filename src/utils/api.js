import axios from 'axios';

// Uses production backend when deployed, localhost when running locally
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: BASE_URL.trim(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('db_token');
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  return cfg;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('db_token');
      localStorage.removeItem('db_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
