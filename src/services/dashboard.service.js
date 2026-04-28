import { api } from './api.js';

export const dashboardService = {
  kpis: () => api.get('/dashboard/kpis').then((r) => r.data),
  statusBreakdown: () => api.get('/dashboard/status-breakdown').then((r) => r.data),
  monthlyTrend: (months = 6) =>
    api.get('/dashboard/monthly-trend', { params: { months } }).then((r) => r.data),
  topBanks: () => api.get('/dashboard/top-banks').then((r) => r.data),
  recentCases: () => api.get('/dashboard/recent-cases').then((r) => r.data),
  channelBreakdown: () => api.get('/dashboard/channel-breakdown').then((r) => r.data),
  handlerPerformance: () => api.get('/dashboard/handler-performance').then((r) => r.data),
  productBreakdown: () => api.get('/dashboard/product-breakdown').then((r) => r.data),
  pipelineSummary: () => api.get('/dashboard/pipeline-summary').then((r) => r.data),
  allDistributions: () => api.get('/dashboard/all-distributions').then((r) => r.data),
};

export const insuranceService = {
  list: (params) => api.get('/insurance', { params }).then((r) => r.data),
  get: (id) => api.get(`/insurance/${id}`).then((r) => r.data),
  create: (data) => api.post('/insurance', data).then((r) => r.data),
  update: (id, data) => api.patch(`/insurance/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/insurance/${id}`).then((r) => r.data),
  meta: () => api.get('/insurance/meta').then((r) => r.data),
};

export const contestsService = {
  list: (params) => api.get('/contests', { params }).then((r) => r.data),
  get: (id) => api.get(`/contests/${id}`).then((r) => r.data),
  create: (data) => api.post('/contests', data).then((r) => r.data),
  update: (id, data) => api.patch(`/contests/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/contests/${id}`).then((r) => r.data),
  leaderboard: (id) => api.get(`/contests/${id}/leaderboard`).then((r) => r.data),
  meta: () => api.get('/contests/meta').then((r) => r.data),
};

export const followupsService = {
  inbox: (days = 7) =>
    api.get('/followups/inbox', { params: { days } }).then((r) => r.data),
};
