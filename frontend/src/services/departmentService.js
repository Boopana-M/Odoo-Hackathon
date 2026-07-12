import api from './api';

const departmentService = {
  async list() {
    const response = await api.get('/departments');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/departments', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  }
};

export default departmentService;
