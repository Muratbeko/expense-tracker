
import axios from 'axios';
import { API_CONFIG as CONFIG } from './constants';

// Create centralized axios instance
export const apiClient = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Legacy exports for backward compatibility
export const API_BASE_URL = CONFIG.BASE_URL;
export const API_CONFIG = {
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Health check function
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/health`);
    if (!response.ok) {
      console.error('API health check failed:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
}; 