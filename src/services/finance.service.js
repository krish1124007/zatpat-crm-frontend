import { api } from './api.js';

export const partnersService = {
  list: (params) => api.get('/partners', { params }).then((r) => r.data),
  get: (id) => api.get(`/partners/${id}`).then((r) => r.data),
  create: (data) => api.post('/partners', data).then((r) => r.data),
  update: (id, data) => api.patch(`/partners/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/partners/${id}`).then((r) => r.data),
};

export const invoicesService = {
  list: (params) => api.get('/invoices', { params }).then((r) => r.data),
  get: (id) => api.get(`/invoices/${id}`).then((r) => r.data),
  create: (data) => api.post('/invoices', data).then((r) => r.data),
  generateFromCase: (caseId, payload) =>
    api.post(`/invoices/generate/${caseId}`, payload).then((r) => r.data),
  update: (id, data) => api.patch(`/invoices/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/invoices/${id}`).then((r) => r.data),
  pdfUrl: (id) => `/api/v1/invoices/${id}/pdf`,
};

export const expensesService = {
  list: (params) => api.get('/expenses', { params }).then((r) => r.data),
  categories: () => api.get('/expenses/categories').then((r) => r.data),
  create: (data) => api.post('/expenses', data).then((r) => r.data),
  update: (id, data) => api.patch(`/expenses/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/expenses/${id}`).then((r) => r.data),
};

export const salaryService = {
  list: (params) => api.get('/salary', { params }).then((r) => r.data),
  upsert: (data) => api.post('/salary', data).then((r) => r.data),
  remove: (id) => api.delete(`/salary/${id}`).then((r) => r.data),
  suggestIncentive: (params) =>
    api.get('/salary/incentive/suggest', { params }).then((r) => r.data),
  employees: () => api.get('/salary/employees').then((r) => r.data),
};

export const reportsService = {
  gst: (params) => api.get('/reports/gst', { params }).then((r) => r.data),
  pnl: (params) => api.get('/reports/pnl', { params }).then((r) => r.data),
};
