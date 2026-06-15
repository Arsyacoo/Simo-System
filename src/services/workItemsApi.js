import { apiData } from './apiClient';

export function getWorkItems() {
  return apiData('/work-items');
}

export function getWorkItem(id) {
  return apiData(`/work-items/${encodeURIComponent(id)}`);
}

export function getWarehouseWorkItems(warehouseId) {
  return apiData(`/warehouses/${encodeURIComponent(warehouseId)}/work-items`);
}

export function updateWorkItemStatus(id, status, userId) {
  return apiData(`/work-items/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, userId }),
  });
}
