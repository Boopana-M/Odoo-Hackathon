import api from './api';

const assetService = {
  async list(params = {}) {
    const response = await api.get('/assets', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/assets', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  }
};

export default assetService;
