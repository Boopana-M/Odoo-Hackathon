import api from './api';

const auditService = {
  async list() {
    const response = await api.get('/audits');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/audits/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/audits', data);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.patch(`/audits/${id}/status`, { status });
    return response.data;
  },

  async close(id) {
    const response = await api.patch(`/audits/${id}/close`);
    return response.data;
  },

  async verifyAsset(cycleId, data) {
    const response = await api.post(`/audits/${cycleId}/verify`, data);
    return response.data;
  }
};

export default auditService;
