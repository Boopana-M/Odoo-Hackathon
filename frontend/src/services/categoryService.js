import api from './api';

const categoryService = {
  async list() {
    const response = await api.get('/asset-categories');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/asset-categories/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/asset-categories', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/asset-categories/${id}`, data);
    return response.data;
  }
};

export default categoryService;
