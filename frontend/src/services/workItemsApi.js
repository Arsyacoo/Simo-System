import { apiRequest } from './apiClient';

export function getWorkItems() {
  return apiRequest('/work-items');
}

export function getWorkItem(id) {
  return apiRequest(`/work-items/${encodeURIComponent(id)}`);
}

export function getWarehouseWorkItems(warehouseId) {
  return apiRequest(`/warehouses/${encodeURIComponent(warehouseId)}/work-items`);
}

export function updateWorkItemStatus(id, status, userId) {
  return apiRequest(`/work-items/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, userId }),
  });
}
