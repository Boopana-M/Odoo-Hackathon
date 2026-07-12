import api from './api';

const dashboardService = {
  async getSummary() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  async listActivityLogs() {
    const response = await api.get('/activity-logs');
    return response.data;
  }
};

export default dashboardService;
