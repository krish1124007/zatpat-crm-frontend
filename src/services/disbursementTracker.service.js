import { api } from './api.js';

export const disbursementTrackerService = {
  list(params = {}) {
    return api.get('/disbursement-trackers', { params }).then((r) => r.data);
  },
  create(payload) {
    return api.post('/disbursement-trackers', payload).then((r) => r.data);
  },
  update(id, patch) {
    return api.patch(`/disbursement-trackers/${id}`, patch).then((r) => r.data);
  },
  remove(id) {
    return api.delete(`/disbursement-trackers/${id}`).then((r) => r.data);
  },
};
