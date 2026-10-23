// API Client for JanSolve + JanFeed

const API_BASE = '/api/v1';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('jansolve_token');

  const headers = { ...options.headers };

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized, attempt refresh token once
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          const refreshData = await refreshRes.json();

          if (refreshRes.ok && refreshData.data?.accessToken) {
            localStorage.setItem('jansolve_token', refreshData.data.accessToken);
            isRefreshing = false;
            processQueue(null, refreshData.data.accessToken);

            // Retry original request
            headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            isRefreshing = false;
            processQueue(new Error('Refresh failed'), null);
            localStorage.removeItem('jansolve_token');
            localStorage.removeItem('jansolve_user');
          }
        } catch (refreshErr) {
          isRefreshing = false;
          processQueue(refreshErr, null);
          localStorage.removeItem('jansolve_token');
          localStorage.removeItem('jansolve_user');
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = response.status;
      error.code = data.code;
      error.errors = data.errors;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};
