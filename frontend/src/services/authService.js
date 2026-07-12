import api from './api';

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('employee', JSON.stringify(response.data.employee));
    }
    return response.data;
  },

  async signup(name, email, password) {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('employee', JSON.stringify(response.data.employee));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('employee');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCurrentEmployee() {
    const empStr = localStorage.getItem('employee');
    return empStr ? JSON.parse(empStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

export default authService;
