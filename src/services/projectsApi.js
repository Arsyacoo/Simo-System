import { apiData } from './apiClient';

export function getProjects() {
  return apiData('/projects');
}

export function getProject(id) {
  return apiData(`/projects/${encodeURIComponent(id)}`);
}
