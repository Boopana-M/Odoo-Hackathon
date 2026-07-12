import api from './api';

const transferService = {
  async list() {
    const response = await api.get('/transfers');
    return response.data;
  },

  async create(data) {
    const response = await api.post('/transfers', data);
    return response.data;
  },

  async approve(id, notes = '') {
    const response = await api.patch(/transfers//approve, { decisionNotes: notes });
    return response.data;
  },

  async reject(id, notes = '') {
    const response = await api.patch(/transfers//reject, { decisionNotes: notes });
    return response.data;
  },

  async cancel(id, reason = '') {
    const response = await api.patch(/transfers//cancel, { cancellationReason: reason });
    return response.data;
  }
};

export default transferService;
