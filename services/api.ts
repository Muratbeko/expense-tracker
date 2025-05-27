import type { Budget, SavingGoal, Transaction, User } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);

// API методы
const apiService = {
  // Аутентификация
  async login(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post<User>('/auth/login', { email, password });
      
      // Сервер возвращает данные напрямую, без обертки
      if (response.data && response.data.email) {
        console.log('Login successful');
        return response.data;
      } else {
        throw new Error('Invalid response format - missing user data');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  },

  async register(name: string, email: string, password: string): Promise<User> {
    try {
      console.log('Attempting registration for:', email);
      const response = await api.post<User>('/auth/register', { name, email, password });
      
      // Сервер возвращает данные напрямую, без обертки
      if (response.data && response.data.email) {
        console.log('Registration successful');
        return response.data;
      } else {
        throw new Error('Invalid response format - missing user data');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 409) {
        throw new Error('User with this email already exists');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  },

  async getProfile(email: string): Promise<User> {
    try {
      console.log('Fetching profile for:', email);
      const response = await api.get<User>(`/users/me?email=${email}`);
      
      if (response.data && response.data.email) {
        return response.data;
      } else {
        throw new Error('Invalid profile data received');
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 404) {
        throw new Error('User profile not found');
      }
      throw new Error(error.message || 'Failed to fetch profile');
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
      console.log('Server logout successful');
    } catch (error: any) {
      console.warn('Logout request failed, but continuing with local cleanup:', error);
    }
  },

  // Транзакции
  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      const url = userId ? `/transactions?userId=${userId}` : '/transactions';
      const response = await api.get<Transaction[]>(url);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch transactions');
    }
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const response = await api.post<Transaction>('/transactions', transaction);
      return response.data;
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create transaction');
    }
  },

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await api.put<Transaction>(`/transactions/${id}`, transaction);
      return response.data;
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update transaction');
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete transaction');
    }
  },

  // Бюджет
  async getBudget(userId?: string): Promise<Budget> {
    try {
      const url = userId ? `/budgets/current?userId=${userId}` : '/budgets/current';
      const response = await api.get<Budget>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching budget:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch budget');
    }
  },

  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const response = await api.post<Budget>('/budgets', budget);
      return response.data;
    } catch (error: any) {
      console.error('Error creating budget:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create budget');
    }
  },

  async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
    try {
      const response = await api.put<Budget>(`/budgets/${id}`, budget);
      return response.data;
    } catch (error: any) {
      console.error('Error updating budget:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update budget');
    }
  },

  // Цели сбережений
  async getGoals(userId?: string): Promise<SavingGoal[]> {
    try {
      const url = userId ? `/goals?userId=${userId}` : '/goals';
      const response = await api.get<SavingGoal[]>(url);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch goals');
    }
  },

  async createGoal(goal: Omit<SavingGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavingGoal> {
    try {
      const response = await api.post<SavingGoal>('/goals', goal);
      return response.data;
    } catch (error: any) {
      console.error('Error creating goal:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create goal');
    }
  },

  async updateGoal(id: string, goal: Partial<SavingGoal>): Promise<SavingGoal> {
    try {
      const response = await api.put<SavingGoal>(`/goals/${id}`, goal);
      return response.data;
    } catch (error: any) {
      console.error('Error updating goal:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update goal');
    }
  },

  async deleteGoal(id: string): Promise<void> {
    try {
      await api.delete(`/goals/${id}`);
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete goal');
    }
  },

  // Уведомления
  async getNotifications(userId?: string): Promise<any[]> {
    try {
      const url = userId ? `/notifications?userId=${userId}` : '/notifications';
      const response = await api.get<any[]>(url);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to fetch notifications');
    }
  },

  async getUnreadNotificationsCount(userId?: string): Promise<number> {
    try {
      const url = userId ? `/notifications/unread/count?userId=${userId}` : '/notifications/unread/count';
      const response = await api.get<{ count: number }>(url);
      return response.data.count || 0;
    } catch (error: any) {
      console.error('Error fetching unread notifications count:', error);
      return 0;
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to mark notification as read');
    }
  },

  async markAllNotificationsAsRead(userId?: string): Promise<void> {
    try {
      const url = userId ? `/notifications/mark-all-read?userId=${userId}` : '/notifications/mark-all-read';
      await api.put(url);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to mark all notifications as read');
    }
  },

  async deleteNotification(id: string): Promise<void> {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete notification');
    }
  },

  async deleteAllNotifications(userId?: string): Promise<void> {
    try {
      const url = userId ? `/notifications/clear-all?userId=${userId}` : '/notifications/clear-all';
      await api.delete(url);
    } catch (error: any) {
      console.error('Error deleting all notifications:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to delete all notifications');
    }
  }
};

export default apiService;