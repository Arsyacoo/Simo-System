import { apiRequest } from './apiClient';

export function getWarehouses() {
  return apiRequest('/warehouses');
}

export function createWarehouse(payload) {
  return apiRequest('/warehouses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWarehouse(warehouseId, payload) {
  return apiRequest(`/warehouses/${encodeURIComponent(warehouseId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteWarehouse(warehouseId) {
  return apiRequest(`/warehouses/${encodeURIComponent(warehouseId)}`, {
    method: 'DELETE',
  });
}
