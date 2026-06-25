import { apiRequest } from './apiClient';

export function getProjects() {
  return apiRequest('/projects');
}

export function createProject(payload) {
  return apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProject(projectId, payload) {
  return apiRequest(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteProject(projectId) {
  return apiRequest(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
}
