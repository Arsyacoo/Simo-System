import { apiData } from './apiClient';

export function getQcChecklists() {
  return apiData('/qc-checklists');
}

export function getQcChecklist(id) {
  return apiData(`/qc-checklists/${encodeURIComponent(id)}`);
}

export function submitQcChecklist(payload) {
  return apiData('/qc-checklists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
