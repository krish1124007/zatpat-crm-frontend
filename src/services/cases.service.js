import { api } from './api.js';

export const casesService = {
  list(params = {}) {
    return api.get('/cases', { params }).then((r) => r.data);
  },
  get(id) {
    return api.get(`/cases/${id}`).then((r) => r.data);
  },
  create(payload) {
    return api.post('/cases', payload).then((r) => r.data);
  },
  update(id, patch) {
    return api.patch(`/cases/${id}`, patch).then((r) => r.data);
  },
  remove(id) {
    return api.delete(`/cases/${id}`).then((r) => r.data);
  },
  restore(id) {
    return api.post(`/cases/${id}/restore`).then((r) => r.data);
  },
  addFollowUp(id, payload) {
    return api.post(`/cases/${id}/followups`, payload).then((r) => r.data);
  },
  addPayment(id, kind, payload) {
    return api.post(`/cases/${id}/payments/${kind}`, payload).then((r) => r.data);
  },
  uploadSanctionLetter(id, file) {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/cases/${id}/sanction-letter`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  facets() {
    return api.get('/cases/facets').then((r) => r.data);
  },
  referencePartners(params = {}) {
    return api.get('/cases/reference-partners', { params }).then((res) => res.data);
  },

  referencePartnersAutocomplete() {
    return api.get('/cases/reference-partners-autocomplete').then((res) => res.data);
  },
  // Dropdown options
  getAllDropdownOptions() {
    return api.get('/cases/dropdowns/all').then((r) => r.data);
  },
  getDropdownOptions(type) {
    return api.get('/cases/dropdowns/options', { params: { type } }).then((r) => r.data);
  },
  createDropdownOption(type, label, value, description = '') {
    return api.post('/cases/dropdowns/options', { type, label, value, description }).then((r) => r.data);
  },
};

