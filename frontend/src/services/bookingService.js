import api from './api';

const bookingService = {
  async list(params = {}) {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  async cancel(id, reason = '') {
    const response = await api.patch(`/bookings/${id}/cancel`, { cancellationReason: reason });
    return response.data;
  }
};

export default bookingService;
