import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TransactionType } from '../../types';

import { API_BASE_URL } from '../config/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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

export interface MonthlyReport {
  month: string;
  year: number;
  totalExpenses: number;
  totalIncome: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  recommendations: string[];
}

class ReportService {
  async generateMonthlyReport(): Promise<MonthlyReport> {
    try {
      // Get current month's transactions
      const response = await axios.get<TransactionType[]>(`${API_BASE_URL}/api/transactions`);
      const transactions = response.data;

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
          const current = categoryTotals.get(txn.category as string) || 0;
          categoryTotals.set(txn.category as string, current + txn.amount);
        });

      const categoryBreakdown = Array.from(categoryTotals.entries()).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
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

  async scheduleMonthlyReportNotification() {
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

  async requestNotificationPermissions() {
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
}

export const reportService = new ReportService(); 