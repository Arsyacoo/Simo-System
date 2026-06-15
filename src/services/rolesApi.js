import { apiData } from './apiClient';

export function getRoles() {
  return apiData('/roles');
}
