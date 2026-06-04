import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const RETRY_DELAYS = [0, 5000, 15000]; // ms for attempts #1-3

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error) => {
  if (!error || !error.config) {
    return false;
  }

  const method = error.config.method?.toLowerCase();
  if (method !== 'get') {
    return false;
  }

  if (!error.response) {
    return error.code === 'ECONNABORTED' || error.message === 'Network Error';
  }

  return RETRYABLE_STATUS.has(error.response.status);
};

// Response interceptor for retry-aware error handling
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!shouldRetry(error)) {
      return Promise.reject(error);
    }

    const config = error.config;
    const retryCount = config.__retryCount || 0;

    if (retryCount >= RETRY_DELAYS.length - 1) {
      return Promise.reject(error);
    }

    const nextAttemptIndex = retryCount + 1;
    config.__retryCount = nextAttemptIndex;

    await delay(RETRY_DELAYS[nextAttemptIndex]);
    return client(config);
  }
);

export default client;
