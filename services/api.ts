import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api';
import { API_CONFIG } from '../constants';
import type {
  Budget,
  Category,
  CreateNotificationData,
  ForecastData,
  MonthlyReport,
  Notification,
  SavingGoal,
  Transaction,
  User,
  Wallet
} from '../types/index';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Configure notification channel for Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('monthly-reports', {
    name: 'Monthly Reports',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

class ApiService {
  // ========== Authentication ==========
  async login(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting login for:', email);
      const response = await apiClient.post<User>(`${API_CONFIG.ENDPOINTS.AUTH}/login`, { 
        email, 
        password 
      });
      
      if (response.data && response.data.email) {
        console.log('Login successful');
        return response.data;
      } else {
        throw new Error('Invalid response format - missing user data');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.handleApiError(error, 'Login failed');
      throw error;
    }
  }

  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const response = await apiClient.post<User>(`${API_CONFIG.ENDPOINTS.AUTH}/register`, {
        email,
        password,
        name
      });
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      this.handleApiError(error, 'Registration failed');
      throw error;
    }
  }

  async getProfile(email: string): Promise<User> {
    try {
      console.log('Fetching profile for:', email);
      const response = await apiClient.get<User>(`${API_CONFIG.ENDPOINTS.USERS}/me?email=${email}`);
      
      if (response.data && response.data.email) {
        return response.data;
      } else {
        throw new Error('Invalid profile data received');
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      this.handleApiError(error, 'Failed to fetch profile');
      throw error;
    }
  }

  async updateProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Profile update error:', error);
      this.handleApiError(error, 'Failed to update profile');
      throw error;
    }
  }

  async logout(email?: string, password?: string): Promise<void> {
    try {
      console.log('Logging out user:', email || 'unknown');
      
      // Prepare logout data
      const logoutData: any = {
        timestamp: new Date().toISOString()
      };
      
      // Include email and password if provided
      if (email) {
        logoutData.email = email;
      }
      if (password) {
        logoutData.password = password;
      }
      
      // Call the server logout endpoint
      const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.AUTH}/logout`, logoutData);
      
      console.log('Server logout successful:', response.status);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Don't throw error for logout - allow local logout to proceed
      console.warn('Server logout failed, proceeding with local logout');
    }
  }

  // ========== Transactions ==========
  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      const url = userId 
        ? `${API_CONFIG.ENDPOINTS.TRANSACTIONS}?userId=${userId}` 
        : API_CONFIG.ENDPOINTS.TRANSACTIONS;
      const response = await apiClient.get<Transaction[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      this.handleApiError(error, 'Failed to fetch transactions');
      throw error;
    }
  }

  async getTransaction(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.get<Transaction>(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching transaction ${id}:`, error);
      this.handleApiError(error, 'Failed to fetch transaction details');
      throw error;
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const response = await apiClient.post<Transaction>(API_CONFIG.ENDPOINTS.TRANSACTIONS, transaction);
      return response.data;
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      this.handleApiError(error, 'Failed to create transaction');
      throw error;
    }
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await apiClient.put<Transaction>(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${id}`, transaction);
      return response.data;
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      this.handleApiError(error, 'Failed to update transaction');
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}/${id}`);
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      this.handleApiError(error, 'Failed to delete transaction');
      throw error;
    }
  }

  // ========== Budgets ==========
  async getBudgets(userId?: string): Promise<Budget[]> {
    try {
      const url = userId 
        ? `${API_CONFIG.ENDPOINTS.BUDGETS}?userId=${userId}` 
        : API_CONFIG.ENDPOINTS.BUDGETS;
      const response = await apiClient.get<Budget[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      this.handleApiError(error, 'Failed to fetch budgets');
      throw error;
    }
  }

  async getCurrentBudget(): Promise<Budget> {
    try {
      const response = await apiClient.get<Budget>(`${API_CONFIG.ENDPOINTS.BUDGETS}/current`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching current budget:', error);
      this.handleApiError(error, 'Failed to fetch current budget');
      throw error;
    }
  }

  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const response = await apiClient.post<Budget>(API_CONFIG.ENDPOINTS.BUDGETS, budget);
      return response.data;
    } catch (error: any) {
      console.error('Error creating budget:', error);
      this.handleApiError(error, 'Failed to create budget');
      throw error;
    }
  }

  async updateBudget(id: string, budget: Partial<Budget>): Promise<Budget> {
    try {
      const response = await apiClient.put<Budget>(`${API_CONFIG.ENDPOINTS.BUDGETS}/${id}`, budget);
      return response.data;
    } catch (error: any) {
      console.error('Error updating budget:', error);
      this.handleApiError(error, 'Failed to update budget');
      throw error;
    }
  }

  // ========== Saving Goals ==========
  async getGoals(userId?: string): Promise<SavingGoal[]> {
    try {
      const url = userId 
        ? `${API_CONFIG.ENDPOINTS.GOALS}?userId=${userId}` 
        : API_CONFIG.ENDPOINTS.GOALS;
      const response = await apiClient.get<SavingGoal[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      this.handleApiError(error, 'Failed to fetch goals');
      throw error;
    }
  }

  async createGoal(goal: Omit<SavingGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavingGoal> {
    try {
      const response = await apiClient.post<SavingGoal>(API_CONFIG.ENDPOINTS.GOALS, goal);
      return response.data;
    } catch (error: any) {
      console.error('Error creating goal:', error);
      this.handleApiError(error, 'Failed to create goal');
      throw error;
    }
  }

  async updateGoal(id: string, goal: Partial<SavingGoal>): Promise<SavingGoal> {
    try {
      const response = await apiClient.put<SavingGoal>(`${API_CONFIG.ENDPOINTS.GOALS}/${id}`, goal);
      return response.data;
    } catch (error: any) {
      console.error('Error updating goal:', error);
      this.handleApiError(error, 'Failed to update goal');
      throw error;
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.GOALS}/${id}`);
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      this.handleApiError(error, 'Failed to delete goal');
      throw error;
    }
  }

  // ========== Categories ==========
  async getCategories(type?: 'INCOME' | 'EXPENSE'): Promise<Category[]> {
    try {
      const url = type 
        ? `${API_CONFIG.ENDPOINTS.CATEGORIES}?type=${type}` 
        : API_CONFIG.ENDPOINTS.CATEGORIES;
      const response = await apiClient.get<Category[]>(url);
      return response.data.map((cat: any) => ({
        id: cat.id,
        name: String(cat.name),
        type: cat.type,
        icon: String(cat.icon || '📝'),
        color: String(cat.color || '#F5F5F5')
      }));
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const response = await apiClient.post<Category>(API_CONFIG.ENDPOINTS.CATEGORIES, category);
      return {
        id: response.data.id,
        name: String(response.data.name),
        type: response.data.type,
        icon: String(response.data.icon || '📝'),
        color: String(response.data.color || '#F5F5F5')
      };
    } catch (error: any) {
      console.error('Error creating category:', error);
      this.handleApiError(error, 'Failed to create category');
      throw error;
    }
  }

  // ========== Wallets ==========
  async getWallets(): Promise<Wallet[]> {
    try {
      const response = await apiClient.get<Wallet[]>(API_CONFIG.ENDPOINTS.WALLETS);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      this.handleApiError(error, 'Failed to fetch wallets');
      throw error;
    }
  }

  async createWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
    try {
      const response = await apiClient.post<Wallet>(API_CONFIG.ENDPOINTS.WALLETS, wallet);
      return response.data;
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      this.handleApiError(error, 'Failed to create wallet');
      throw error;
    }
  }

  async updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet> {
    try {
      const response = await apiClient.put<Wallet>(`${API_CONFIG.ENDPOINTS.WALLETS}/${id}`, wallet);
      return response.data;
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      this.handleApiError(error, 'Failed to update wallet');
      throw error;
    }
  }

  async deleteWallet(id: number): Promise<void> {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.WALLETS}/${id}`);
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      this.handleApiError(error, 'Failed to delete wallet');
      throw error;
    }
  }

  // ========== Notifications ==========
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const url = userId 
        ? `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}?userId=${userId}` 
        : API_CONFIG.ENDPOINTS.NOTIFICATIONS;
      const response = await apiClient.get<Notification[]>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      this.handleApiError(error, 'Failed to fetch notifications');
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await apiClient.put(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      this.handleApiError(error, 'Failed to mark notification as read');
      throw error;
    }
  }

  async deleteAllNotifications(userId?: string): Promise<void> {
    try {
      const url = userId 
        ? `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/clear-all?userId=${userId}` 
        : `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/clear-all`;
      await apiClient.delete(url);
    } catch (error: any) {
      console.error('Error deleting all notifications:', error);
      this.handleApiError(error, 'Failed to delete all notifications');
      throw error;
    }
  }

  // ========== Forecast ==========
  async getExpensesForecast(userId: string, category?: string, days: number = 30): Promise<ForecastData> {
    try {
      if (!userId) {
        throw new Error('User ID is required for expenses forecast');
      }

      const params = new URLSearchParams({ days: days.toString() });
      if (category) {
        params.append('category', category);
      }

      const url = `${API_CONFIG.ENDPOINTS.FORECAST}/expenses/${userId}?${params.toString()}`;
      const response = await apiClient.get<ForecastData>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching expenses forecast:', error);
      this.handleApiError(error, 'Failed to fetch expenses forecast');
      throw error;
    }
  }

  async getIncomeForecast(userId: string, category?: string, days: number = 30): Promise<ForecastData> {
    try {
      if (!userId) {
        throw new Error('User ID is required for income forecast');
      }

      const params = new URLSearchParams({ days: days.toString() });
      if (category) {
        params.append('category', category);
      }

      const url = `${API_CONFIG.ENDPOINTS.FORECAST}/income/${userId}?${params.toString()}`;
      const response = await apiClient.get<ForecastData>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching income forecast:', error);
      this.handleApiError(error, 'Failed to fetch income forecast');
      throw error;
    }
  }

  async getBalanceForecast(userId: string, days: number = 30): Promise<ForecastData> {
    try {
      if (!userId) {
        throw new Error('User ID is required for balance forecast');
      }

      const url = `${API_CONFIG.ENDPOINTS.FORECAST}/balance/${userId}?days=${days}`;
      const response = await apiClient.get<ForecastData>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching balance forecast:', error);
      this.handleApiError(error, 'Failed to fetch balance forecast');
      throw error;
    }
  }

  // ========== Account Balance ==========
  async getAccountBalance(): Promise<{ balance: number; income: number; expenses: number }> {
    try {
      const response = await apiClient.get<{ balance: number; income: number; expenses: number }>('/accounts/balance');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching account balance:', error);
      // Return default values instead of throwing
      return { balance: 0, income: 0, expenses: 0 };
    }
  }

  // ========== Image Upload ==========
  async uploadImage(formData: FormData, endpoint: string = '/images/upload'): Promise<{ imageUrl: string }> {
    try {
      const response = await apiClient.post<{ imageUrl: string }>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for uploads
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      this.handleApiError(error, 'Failed to upload image');
      throw error;
    }
  }

  // ========== Health Check ==========
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // ========== Monthly Reports ==========
  async generateMonthlyReport(): Promise<MonthlyReport> {
    try {
      // Get current month's transactions
      const transactions = await this.getTransactions();

      // Filter transactions for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyTransactions = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= startOfMonth && txnDate <= endOfMonth;
      });

      // Calculate totals
      const totalIncome = monthlyTransactions
        .filter(txn => txn.type === 'INCOME')
        .reduce((sum, txn) => sum + txn.amount, 0);

      const totalExpenses = monthlyTransactions
        .filter(txn => txn.type === 'EXPENSE')
        .reduce((sum, txn) => sum + txn.amount, 0);

      // Calculate category breakdown
      const categoryTotals = new Map<string, number>();
      monthlyTransactions
        .filter(txn => txn.type === 'EXPENSE' && txn.category)
        .forEach(txn => {
          // Handle both string and object categories
          const categoryName = typeof txn.category === 'object' && txn.category !== null
            ? (txn.category as any).name || 'Unknown Category'
            : String(txn.category);
          const current = categoryTotals.get(categoryName) || 0;
          categoryTotals.set(categoryName, current + txn.amount);
        });

      const categoryBreakdown = Array.from(categoryTotals.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }));

      // Generate recommendations based on spending patterns
      const recommendations = this.generateRecommendations(categoryBreakdown, totalExpenses, totalIncome);

      return {
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
        totalExpenses,
        totalIncome,
        categoryBreakdown,
        recommendations
      };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  private generateRecommendations(
    categoryBreakdown: { category: string; amount: number; percentage: number }[],
    totalExpenses: number,
    totalIncome: number
  ): string[] {
    const recommendations: string[] = [];

    // Check remaining funds rate
    const remainingFundsRate = (totalIncome - totalExpenses) / totalIncome;
    if (remainingFundsRate < 0.2) {
      recommendations.push(
        'После всех расходов у вас остается ' + Math.round(remainingFundsRate * 100) + 
        '% от дохода. Рекомендуется оставлять не менее 20% от дохода после всех трат. ' +
        'Попробуйте сократить расходы на развлечения и необязательные покупки.'
      );
    }

    // Check for high spending categories
    const highSpendingCategories = categoryBreakdown.filter(cat => cat.percentage > 30);
    highSpendingCategories.forEach(cat => {
      recommendations.push(
        `Расходы на категорию "${cat.category}" составляют ${Math.round(cat.percentage)}% от общих расходов. ` +
        'Это значительно выше рекомендуемого уровня. ' +
        'Рекомендуется проанализировать траты в этой категории и найти способы оптимизации. ' +
        'Например, можно искать более выгодные предложения или сократить количество покупок.'
      );
    });

    // Check for budget balance
    if (totalExpenses > totalIncome) {
      recommendations.push(
        'Ваши расходы превышают доходы в этом месяце. ' +
        'Рекомендуется срочно пересмотреть бюджет и сократить расходы. ' +
        'Начните с категорий с наибольшими тратами и рассмотрите возможность отложить необязательные покупки.'
      );
    }

    // Add positive reinforcement if doing well
    if (remainingFundsRate > 0.3) {
      recommendations.push(
        'Отличная работа! После всех расходов у вас остается ' + Math.round(remainingFundsRate * 100) + 
        '% от дохода, что выше рекомендуемого уровня. ' +
        'Продолжайте придерживаться такого подхода к планированию расходов. ' +
        'Это позволит вам иметь финансовую подушку на случай непредвиденных ситуаций.'
      );
    }

    // Add general recommendations
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown.reduce((prev, current) => 
        (prev.percentage > current.percentage) ? prev : current
      );
      
      if (topCategory.percentage < 30) {
        recommendations.push(
          'Ваши расходы хорошо распределены по категориям. ' +
          'Самая крупная категория расходов - "' + topCategory.category + 
          '" (' + Math.round(topCategory.percentage) + '%). ' +
          'Это хороший показатель сбалансированного бюджета.'
        );
      }
    }

    return recommendations;
  }

  // ========== Notification Services ==========
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // Set up notification handler
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        // Handle notification tap here if needed
      });

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      throw error;
    }
  }

  async scheduleMonthlyReportNotification(): Promise<void> {
    try {
      // Cancel any existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule notification for the 1st of next month at 9:00 AM
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
      const monthName = nextMonth.toLocaleString('ru', { month: 'long' });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Готов новый финансовый отчет',
          body: `Вышел отчет за ${monthName} ${nextMonth.getFullYear()} года. Откройте приложение, чтобы посмотреть детали.`,
          data: { screen: 'monthly-report' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          seconds: Math.floor((nextMonth.getTime() - now.getTime()) / 1000),
          channelId: 'monthly-reports',
        },
      });
    } catch (error) {
      console.error('Error scheduling monthly report notification:', error);
      throw error;
    }
  }

  async createAndSendNotification(data: CreateNotificationData): Promise<any> {
    try {
      // 1. Create notification record in DB
      const notification = await this.createNotificationInDB(data);
      
      // 2. Send push notification if needed
      if (this.shouldSendPushNotification(data.notificationType)) {
        await this.sendPushNotification(notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  private async createNotificationInDB(data: CreateNotificationData): Promise<any> {
    const notification = {
      id: Date.now(),
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    // Here you would save to your actual database
    // For now, we'll just return the mock notification
    
    return notification;
  }

  private shouldSendPushNotification(type: string): boolean {
    switch (type) {
      case 'BUDGET_ALERT':
      case 'TRANSACTION':
        return true;
      case 'SYSTEM':
        return false;
      default:
        return false;
    }
  }

  private async sendPushNotification(notification: any): Promise<void> {
    const message = {
      to: 'ExponentPushToken[...]', // This would be the user's device token
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.notificationType,
      },
      badge: await this.getUnreadCount(notification.userId),
    };
    
    // Here you would send through Expo Push API or other service
    console.log('Would send push notification:', message);
  }

  private async getUnreadCount(userId?: number): Promise<number> {
    // This would return actual unread count from database
    return 0;
  }

  // ========== Error Handling ==========
  private handleApiError(error: any, defaultMessage: string): void {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied');
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || defaultMessage);
    }
  }
  
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 