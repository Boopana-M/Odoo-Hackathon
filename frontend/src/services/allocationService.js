import api from './api';

const allocationService = {
  // Allocations
  async list() {
    const response = await api.get('/allocations');
    return response.data;
  },

  async allocate(data) {
    const response = await api.post('/allocations', data);
    return response.data;
  },

  async returnAsset(id, data) {
    const response = await api.patch(`/allocations/${id}/return`, data);
    return response.data;
  },

  async requestReturn(id, data) {
    const response = await api.patch(`/allocations/${id}/request-return`, data);
    return response.data;
  },

  // Transfers
  async listTransfers() {
    const response = await api.get('/transfers');
    return response.data;
  },

  async createTransfer(data) {
    const response = await api.post('/transfers', data);
    return response.data;
  },

  async approveTransfer(id) {
    const response = await api.patch(`/transfers/${id}/approve`);
    return response.data;
  },

  async rejectTransfer(id, reason = '') {
    const response = await api.patch(`/transfers/${id}/reject`, { reason });
    return response.data;
  },

  async cancelTransfer(id) {
    const response = await api.patch(`/transfers/${id}/cancel`);
    return response.data;
  }
};

export default allocationService;
