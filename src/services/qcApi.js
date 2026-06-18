import { apiRequest } from './apiClient';

export function getQcChecklists() {
  return apiRequest('/qc-checklists');
}

export function getQcChecklist(id) {
  return apiRequest(`/qc-checklists/${encodeURIComponent(id)}`);
}

export function submitQcChecklist(payload) {
  const isFormData = payload instanceof FormData;
  return apiRequest('/qc-checklists', {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
  });
}
