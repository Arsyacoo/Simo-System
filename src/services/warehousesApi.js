import { apiData } from './apiClient';

export function getWarehouses() {
  return apiData('/warehouses');
}

export function getWarehouse(id) {
  return apiData(`/warehouses/${encodeURIComponent(id)}`);
}

export function getProjectWarehouses(projectId) {
  return apiData(`/projects/${encodeURIComponent(projectId)}/warehouses`);
}
