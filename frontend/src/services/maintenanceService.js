import api from './api';

const maintenanceService = {
  async list() {
    const response = await api.get('/maintenance');
    return response.data;
  },

  async create(data) {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  async approve(id, notes = '') {
    const response = await api.patch(`/maintenance/${id}/approve`, { decisionNotes: notes });
    return response.data;
  },

  async reject(id, notes = '') {
    const response = await api.patch(`/maintenance/${id}/reject`, { decisionNotes: notes });
    return response.data;
  },

  async assign(id, technicianId) {
    const response = await api.patch(`/maintenance/${id}/assign`, { assignedTechnician: technicianId });
    return response.data;
  },

  async updateProgress(id, progressNotes) {
    const response = await api.patch(`/maintenance/${id}/progress`, { workNotes: progressNotes });
    return response.data;
  },

  async resolve(id, resolutionNotes) {
    const response = await api.patch(`/maintenance/${id}/resolve`, { workNotes: resolutionNotes });
    return response.data;
  }
};

export default maintenanceService;
