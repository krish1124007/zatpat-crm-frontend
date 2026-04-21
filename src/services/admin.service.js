import { api } from './api.js';

export const adminService = {
  // IP whitelist
  listIPs: () => api.get('/admin/ip-whitelist').then((r) => r.data),
  addIP: (data) => api.post('/admin/ip-whitelist', data).then((r) => r.data),
  updateIP: (id, data) => api.patch(`/admin/ip-whitelist/${id}`, data).then((r) => r.data),
  removeIP: (id) => api.delete(`/admin/ip-whitelist/${id}`).then((r) => r.data),

  // Audit logs
  auditLogs: (params) => api.get('/admin/audit-logs', { params }).then((r) => r.data),
  auditFacets: () => api.get('/admin/audit-logs/facets').then((r) => r.data),

  // Backup (returns blob URL string for download)
  backupUrl: () => '/api/v1/admin/backup',

  // Super search
  search: (q) => api.get('/admin/search', { params: { q } }).then((r) => r.data),

  // Staff / User management
  listUsers: () => api.get('/admin/users').then((r) => r.data),
  createUser: (data) => api.post('/admin/users', data).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};
