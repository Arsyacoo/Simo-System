import { apiRequest } from './apiClient';

export function sendManifestLocation(manifestId, payload) {
  return apiRequest(`/logistics/manifests/${encodeURIComponent(manifestId)}/locations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getLatestManifestLocation(manifestId) {
  return apiRequest(`/logistics/manifests/${encodeURIComponent(manifestId)}/locations/latest`);
}

export function getManifestLocationHistory(manifestId, limit = 50) {
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(limit));

  return apiRequest(
    `/logistics/manifests/${encodeURIComponent(manifestId)}/locations/history?${searchParams.toString()}`,
  );
}
