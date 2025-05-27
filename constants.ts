import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || `http://${process.env.EXPO_PUBLIC_HOST_IP}:8080`,
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000'),
  ENDPOINTS: {
    AUTH: '/api/auth',
    USERS: '/api/users',
    TRANSACTIONS: '/api/transactions',
    BUDGETS: '/api/budgets',
    GOALS: '/api/goals',
    CATEGORIES: '/api/categories',
    WALLETS: '/api/wallets',
    NOTIFICATIONS: '/api/notifications',
    FORECAST: '/api/forecast',
    IMAGES: '/images',
    ACCOUNTS: '/api/accounts'
  }
};

// Google Services
export const GOOGLE_CONFIG = {
  GEMINI_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  SPEECH_API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY,
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  SPEECH_API_URL: 'https://speech.googleapis.com/v1/speech:recognize'
};

// Server Configuration
export const SERVER_CONFIG = {
  PORT: process.env.SERVER_PORT || 8080,
  CORS_ORIGIN: process.env.CORS_ORIGIN || `http://${process.env.EXPO_PUBLIC_HOST_IP}:8080`
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Expense Tracker',
  VERSION: '1.0.0',
  TIMEOUT: {
    REQUEST: 10000,
    UPLOAD: 30000
  }
}; 