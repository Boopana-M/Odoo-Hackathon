import api from './api';

const employeeService = {
  async list() {
    const response = await api.get('/users');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateRole(id, role) {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  async updateStatus(id, isActive) {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  async updateDepartment(id, departmentId) {
    const response = await api.patch(`/users/${id}/department`, { departmentId });
    return response.data;
  }
};

export default employeeService;
