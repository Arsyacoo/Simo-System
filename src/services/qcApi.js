import { apiRequest } from './apiClient';

export function getQcChecklists() {
  return apiRequest('/qc-checklists');
}

export function getQcChecklist(id) {
  return apiRequest(`/qc-checklists/${encodeURIComponent(id)}`);
}

export function submitQcChecklist(payload) {
  return apiRequest('/qc-checklists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
