import type { Budget } from '@/types';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationDetail } from '../components/NotificationDetail';

// Настройка обработки уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.0.109:8080';

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  description?: string;
  createdAt: string;
  isRead: boolean;
  notificationType?: string;
  priority?: string;
  userId?: number;
  budgetId?: number;
}

export default function NotificationsScreen() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Запрос разрешений на уведомления
    registerForPushNotificationsAsync();

    // Обработчик входящих уведомлений (когда приложение открыто)
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Просто перезагружаем уведомления без дублирования
      loadNotifications();
    });

    // Обработчик нажатий на уведомления
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const notificationData = response.notification.request.content.data;
      if (notificationData?.notificationId) {
        loadNotifications().then(() => {
          const notification = notifications.find(n => n.id === notificationData.notificationId);
          if (notification) {
            setSelectedNotification(notification);
            if (!notification.isRead) {
              markAsRead(notification.id);
            }
          }
        });
      }
    });

    // Загрузка уведомлений из БД
    loadNotifications();

    return () => {
      notificationListener && Notifications.removeNotificationSubscription(notificationListener);
      responseListener && Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Push notifications permission not granted!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
    
    return token;
  };

  const loadNotifications = async () => {
    try {
      const [notificationsResponse, countResponse] = await Promise.all([
        axios.get<NotificationItem[]>(`${API_BASE_URL}/api/notifications`),
        axios.get<{ count: number }>(`${API_BASE_URL}/api/notifications/unread/count`)
      ]);
      
      setNotifications(notificationsResponse.data);
      setUnreadCount(countResponse.data.count);
      
      // Обновляем badge приложения
      await Notifications.setBadgeCountAsync(countResponse.data.count);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);
      
      // Обновляем локальное состояние
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Обновляем счетчик непрочитанных
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      
      // Обновляем badge приложения
      await Notifications.setBadgeCountAsync(newCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/read-all`);
      
      // Обновляем локальное состояние
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
      
      // Обновляем badge приложения
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/notifications/clear-all`);
              setNotifications([]);
              setUnreadCount(0);
              await Notifications.setBadgeCountAsync(0);
            } catch (error) {
              console.error('Error clearing all notifications:', error);
              Alert.alert('Error', 'Failed to clear all notifications');
            }
          }
        }
      ]
    );
  };

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${id}`);
      
      // Удаляем из локального состояния
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Обновляем счетчик, если удаленное уведомление было непрочитанным
      if (deletedNotification && !deletedNotification.isRead) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        await Notifications.setBadgeCountAsync(newCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleLongPress = (notification: NotificationItem) => {
    Alert.alert(
      'Notification Actions',
      'What would you like to do?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
          onPress: () => {
            if (!notification.isRead) {
              markAsRead(notification.id);
            }
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(notification.id)
        }
      ],
      { cancelable: true }
    );
  };

  const fetchBudget = async () => {
    try {
      const response = await axios.get<Budget>(`${API_BASE_URL}/api/budgets/current`);
      setBudget(response.data);
    } catch (error) {
      console.error('Error fetching budget:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBudget(), loadNotifications()]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return '#F44336';
      case 'LOW':
        return '#4CAF50';
      default:
        return '#FF9800';
    }
  };

  const getNotificationTypeColor = (type?: string) => {
    switch (type) {
      case 'BUDGET_ALERT':
        return '#F44336';
      case 'TRANSACTION':
        return '#4CAF50';
      case 'PUSH':
        return '#2196F3';
      default:
        return '#FF9800';
    }
  };

  const getNotificationTypeLabel = (type?: string) => {
    switch (type) {
      case 'BUDGET_ALERT':
      case 'BUDGET':
        return 'Budget Alert';
      case 'TRANSACTION':
        return 'Transaction';
      case 'PUSH':
        return 'Push';
      default:
        return type ? type : '';
    }
  };

  // Функция для определения, нужно ли показывать badge типа
  const shouldShowTypeBadge = (type?: string) => {
    return type && type !== 'NORMAL' && type !== 'SYSTEM' && getNotificationTypeLabel(type) !== '';
  };

  // Функция для определения, нужно ли показывать приоритет
  const shouldShowPriority = (priority?: string) => {
    return priority && priority !== 'NORMAL' && priority !== 'MEDIUM';
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Заголовок с количеством непрочитанных */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
        </Text>
        <View style={styles.headerButtons}>
          {/* Кнопка для очистки всех уведомлений */}
          {notifications.length > 0 && (
            <TouchableOpacity 
              style={styles.clearAllButton}
              onPress={clearAllNotifications}
            >
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.map(notification => (
        <TouchableOpacity
          key={notification.id}
          style={[
            styles.notificationItem,
            !notification.isRead && styles.unreadNotification,
            notification.priority === 'HIGH' && styles.highPriorityNotification
          ]}
          onPress={() => handleNotificationPress(notification)}
          onLongPress={() => handleLongPress(notification)}
        >
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            {shouldShowTypeBadge(notification.notificationType) && (
              <View style={[
                styles.typeBadge,
                { backgroundColor: getNotificationTypeColor(notification.notificationType) }
              ]}>
                <Text style={styles.typeText} numberOfLines={1}>
                  {getNotificationTypeLabel(notification.notificationType)}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
          
          {notification.description && notification.description !== notification.body && (
            <Text style={styles.notificationDescription} numberOfLines={1}>
              {notification.description}
            </Text>
          )}
          
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>
              {formatDate(notification.createdAt)}
            </Text>
            {shouldShowPriority(notification.priority) && (
              <Text style={[
                styles.priorityText,
                { color: getPriorityColor(notification.priority) }
              ]}>
                {notification.priority}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {notifications.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No notifications yet
          </Text>
        </View>
      )}

      <NotificationDetail
        visible={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification ? {
          title: selectedNotification.title,
          body: selectedNotification.body,
          description: selectedNotification.description,
          date: new Date(selectedNotification.createdAt)
        } : null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  headerButtons: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  clearAllButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    minWidth: 90,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  markAllButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 90,
    alignItems: 'center',
  },
  markAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadNotification: {
    borderLeftColor: '#2196F3',
    backgroundColor: '#F3F9FF',
  },
  highPriorityNotification: {
    borderLeftColor: '#F44336',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    flexShrink: 0,
    minWidth: 90,
    alignItems: 'center',
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notificationBody: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  priorityText: {
    fontSize: 10,
    color: '#757575',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});