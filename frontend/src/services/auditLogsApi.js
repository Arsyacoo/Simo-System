import { apiRequest } from './apiClient';

export function getAuditLogs(filters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.module) {
    searchParams.set('module', filters.module);
  }

  if (filters.userId) {
    searchParams.set('userId', filters.userId);
  }

  const query = searchParams.toString();
  return apiRequest(`/audit-logs${query ? `?${query}` : ''}`);
}
