import api from './api';

const notificationService = {
  async list() {
    const response = await api.get('/notifications');
    return response.data;
  },

  async read(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async readAll() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};

export default notificationService;
