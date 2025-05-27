import type { Budget } from '@/types';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';

import { API_BASE_URL } from '../api';

interface BudgetNotificationProps {
  budget: Budget;
  userId?: number; // Опционально, если используется система пользователей
}

export const BudgetNotification: React.FC<BudgetNotificationProps> = ({ budget, userId }) => {
  const percentage = (budget.spent / budget.total) * 100;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= 80;

  useEffect(() => {
    if (isNearLimit) {
      const title = isOverBudget ? 'Budget Exceeded' : 'Budget Warning';
      const body = isOverBudget 
        ? `Your budget has been exceeded by ${formatCurrency(budget.spent - budget.total)}`
        : `Your budget has reached ${percentage.toFixed(0)}% of the limit`;
      
      const description = isOverBudget
        ? `You have spent ${formatCurrency(budget.spent)} out of your ${formatCurrency(budget.total)} budget. Consider reviewing your expenses and adjusting your spending habits.`
        : `You have spent ${formatCurrency(budget.spent)} out of your ${formatCurrency(budget.total)} budget. You have ${formatCurrency(budget.total - budget.spent)} remaining.`;

      // Отправляем push-уведомление
      sendPushNotification(title, body);
      
      // Сохраняем уведомление в БД
      saveNotificationToDB(title, body, description, isOverBudget ? 'HIGH' : 'NORMAL');
    }
  }, [percentage, isOverBudget, budget]);

  const saveNotificationToDB = async (
    title: string, 
    body: string, 
    description: string, 
    priority: string
  ) => {
    try {
      const notificationData = {
        title,
        body,
        description,
        notificationType: 'BUDGET',
        priority,
        ...(userId && { userId }),
        ...(budget.id && { budgetId: budget.id })
      };

      if (userId) {
        await axios.post(`${API_BASE_URL}/api/notifications/user/${userId}`, notificationData);
      } else {
        await axios.post(`${API_BASE_URL}/api/notifications`, notificationData);
      }
    } catch (error) {
      console.error('Error saving notification to DB:', error);
    }
  };

  return null;
};

const sendPushNotification = async (title: string, body: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { screen: 'notifications' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

const formatCurrency = (value: number): string => {
  return `KGS ${Math.abs(value).toFixed(2)}`;
};