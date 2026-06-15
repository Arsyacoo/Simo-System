import { apiData } from './apiClient';

export function getUsers() {
  return apiData('/users');
}

export function getUser(id) {
  return apiData(`/users/${encodeURIComponent(id)}`);
}
