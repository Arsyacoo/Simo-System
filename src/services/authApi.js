import { apiData } from './apiClient';

export function loginWithApi(credentials) {
  return apiData('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(token) {
  return apiData('/auth/me', { token });
}
