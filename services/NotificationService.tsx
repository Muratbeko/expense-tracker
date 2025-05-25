// NotificationService.ts - пример серверного сервиса

export interface CreateNotificationData {
    title: string;
    body: string;
    description?: string;
    notificationType: 'BUDGET_ALERT' | 'TRANSACTION' | 'SYSTEM';
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    userId?: number;
    budgetId?: number;
  }
  
  export class NotificationService {
    
    // Создание уведомления в БД и отправка push-уведомления
    async createAndSendNotification(data: CreateNotificationData) {
      try {
        // 1. Создаем запись в БД
        const notification = await this.createNotificationInDB(data);
        
        // 2. Отправляем push-уведомление (если нужно)
        if (this.shouldSendPushNotification(data.notificationType)) {
          await this.sendPushNotification(notification);
        }
        
        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    }
    
    private async createNotificationInDB(data: CreateNotificationData) {
      // Здесь ваша логика сохранения в БД
      // Возвращает созданную запись
      const notification = {
        id: Date.now(), // В реальности - ID из БД
        ...data,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      // Сохранение в БД...
      
      return notification;
    }
    
    private shouldSendPushNotification(type: string): boolean {
      // Определяем, для каких типов отправлять push-уведомления
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
    
    private async sendPushNotification(notification: any) {
      // Логика отправки через Expo Push API или другой сервис
      const message = {
        to: 'ExponentPushToken[...]', // Токен устройства пользователя
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.id,
          type: notification.notificationType,
        },
        badge: await this.getUnreadCount(notification.userId),
      };
      
      // Отправка через Expo Push API
      // await this.expoPushService.send(message);
    }
    
    private async getUnreadCount(userId?: number): Promise<number> {
      // Возвращает количество непрочитанных уведомлений для пользователя
      // В реальности - запрос к БД
      return 0;
    }
  }
  
  // Пример использования в контроллере
  export class BudgetController {
    private notificationService = new NotificationService();
    
    async checkBudgetLimits(budgetId: number, userId: number) {
      const budget = await this.getBudget(budgetId);
      const spent = await this.getSpentAmount(budgetId);
      const percentage = (spent / budget.limit) * 100;
      
      // Отправляем уведомление только если превышен лимит
      if (percentage >= 99) {
        await this.notificationService.createAndSendNotification({
          title: 'Budget Warning',
          body: `Your budget has reached ${Math.round(percentage)}% of the limit`,
          description: `You have spent $${spent} out of your $${budget.limit} budget.`,
          notificationType: 'BUDGET_ALERT',
          priority: 'HIGH',
          userId,
          budgetId,
        });
      } else if (percentage >= 80) {
        await this.notificationService.createAndSendNotification({
          title: 'Budget Alert',
          body: `Your budget has reached ${Math.round(percentage)}% of the limit`,
          description: `You have spent $${spent} out of your $${budget.limit} budget.`,
          notificationType: 'BUDGET_ALERT',
          priority: 'NORMAL',
          userId,
          budgetId,
        });
      }
    }
    
    private async getBudget(budgetId: number) {
      // Логика получения бюджета
      return { id: budgetId, limit: 10000 };
    }
    
    private async getSpentAmount(budgetId: number) {
      // Логика подсчета потраченной суммы
      return 9900;
    }
  }