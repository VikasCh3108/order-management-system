import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for common error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pass through errors for individual components to handle
    return Promise.reject(error);
  }
);

export default client;
