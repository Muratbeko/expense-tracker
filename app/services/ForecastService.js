// services/ForecastService.js
import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '../config/api';

// Создаем экземпляр axios с конфигурацией
const api = axios.create(API_CONFIG);

class ForecastService {
  static async getExpensesForecast(userId, category = null, days = 30) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for expenses forecast');
      }

      const searchParams = new URLSearchParams({ days: days.toString() });
      if (category) {
        searchParams.append('category', category);
      }

      const url = `/api/forecast/expenses/${userId}?${searchParams.toString()}`;
      console.log(`Fetching expenses forecast with URL: ${API_BASE_URL}${url}`);
      
      const response = await api.get(url);
      console.log('Expenses forecast response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses forecast:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId,
        category,
        days
      });
      throw error;
    }
  }

  static async getIncomeForecast(userId, category = null, days = 30) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for income forecast');
      }

      const searchParams = new URLSearchParams({ days: days.toString() });
      if (category) {
        searchParams.append('category', category);
      }

      const url = `/api/forecast/income/${userId}?${searchParams.toString()}`;
      console.log(`Fetching income forecast with URL: ${API_BASE_URL}${url}`);
      
      const response = await api.get(url);
      console.log('Income forecast response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching income forecast:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId,
        category,
        days
      });
      throw error;
    }
  }

  static async getBalanceForecast(userId, days = 30) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for balance forecast');
      }

      const url = `/api/forecast/balance/${userId}?days=${days}`;
      console.log(`Fetching balance forecast with URL: ${API_BASE_URL}${url}`);
      
      const response = await api.get(url);
      console.log('Balance forecast response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching balance forecast:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId,
        days
      });
      throw error;
    }
  }
}

export default ForecastService;