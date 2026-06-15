export const useBackendApi =
  String(import.meta.env.VITE_USE_BACKEND_API || 'false').toLowerCase() === 'true';

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

const DEFAULT_TIMEOUT_MS = 5000;

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApiError';
    Object.assign(this, details);
  }
}

export async function apiRequest(path, options = {}) {
  const {
    token,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    body,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...fetchOptions,
      body,
      headers: requestHeaders,
      signal: fetchOptions.signal || controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        payload?.error?.message || `API request failed with status ${response.status}.`,
        {
          status: response.status,
          code: payload?.error?.code,
          details: payload?.error?.details,
          payload,
        },
      );
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('API request timed out.', { code: 'REQUEST_TIMEOUT' });
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error.message || 'API request failed.', {
      code: 'NETWORK_ERROR',
      cause: error,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function apiData(path, options = {}) {
  const payload = await apiRequest(path, options);
  return payload?.data;
}
