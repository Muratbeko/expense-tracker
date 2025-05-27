import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { Stack, Tabs, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../config/api';


function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  // Загружаем количество непрочитанных уведомлений
  const loadUnreadCount = async () => {
    try {
      const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/notifications/unread/count`);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    
    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(loadUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Обновляем счетчик при переходе на другие табы
  useEffect(() => {
    if (state.index !== 2) { // если не на странице уведомлений
      loadUnreadCount();
    }
  }, [state.index]);

  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount);
    // Если есть функция обновления счетчика в таб-баре, вызывайте её тут
    // Например: updateTabBarUnreadCount(unreadCount);
  }, [unreadCount]);

  const handleNotificationsPress = () => {
    router.push('/notifications');
    // Обнуляем счетчик после нажатия на уведомления (опционально)
    setTimeout(() => {
      loadUnreadCount();
    }, 1000);
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

  // SpeedDialFAB анимация
  const toggleFab = () => {
    setFabOpen((prev) => !prev);
    Animated.spring(animation, {
      toValue: fabOpen ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  // Тригонометрия для равномерного расположения кружков
  const radius = 70;
  const angles = [-90, -135, -45]; // mic, photo, manual
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const getCircleStyle = (angle: number) => {
    const x = radius * Math.cos(toRadians(angle));
    const y = radius * Math.sin(toRadians(angle));
    return {
      transform: [
        { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
        { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
        { scale: animation },
      ],
      opacity: animation,
      position: 'absolute' as const,
      left: 8,
      top: 8,
      zIndex: 2,
    };
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      backgroundColor: '#FFFFFF', 
      borderTopWidth: 1, 
      borderTopColor: '#EEEEEE',
      height: Platform.OS === 'ios' ? 85 : 60,
      paddingBottom: Platform.OS === 'ios' ? 25 : 0,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    }}>
      <View style={{ 
        flex: 1, 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        paddingHorizontal: 10
      }}>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center' }}
          onPress={() => { setFabOpen(false); router.push('/'); }}
        >
          <Ionicons name="home" size={24} color={state.index === 0 ? '#5E35B1' : '#757575'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center' }}
          onPress={() => { setFabOpen(false); router.push('/wallet'); }}
        >
          <Ionicons name="wallet" size={24} color={state.index === 1 ? '#5E35B1' : '#757575'} />
        </TouchableOpacity>
        {/* Центральная кнопка SpeedDialFAB с равномерным расположением */}
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>
          {/* Микрофон */}
          <Animated.View style={getCircleStyle(angles[0])} pointerEvents={fabOpen ? 'auto' : 'none'}>
            <TouchableOpacity
              onPress={() => { 
                setFabOpen(false); 
                router.push('/voice-transaction');
              }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#5E35B1', justifyContent: 'center', alignItems: 'center', elevation: 6 }}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={22} color="white" />
            </TouchableOpacity>
          </Animated.View>
          {/* Фото */}
          <Animated.View style={getCircleStyle(angles[1])} pointerEvents={fabOpen ? 'auto' : 'none'}>
            <TouchableOpacity
              onPress={() => { 
                setFabOpen(false); 
                router.push('/receipt-scanner');
              }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#5E35B1', justifyContent: 'center', alignItems: 'center', elevation: 6 }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={22} color="white" />
            </TouchableOpacity>
          </Animated.View>
          {/* Ввод вручную */}
          <Animated.View style={getCircleStyle(angles[2])} pointerEvents={fabOpen ? 'auto' : 'none'}>
            <TouchableOpacity
              onPress={() => { 
                setFabOpen(false); 
                router.push('/?openAddModal=true');
              }}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#5E35B1', justifyContent: 'center', alignItems: 'center', elevation: 6 }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={22} color="white" />
            </TouchableOpacity>
          </Animated.View>
          {/* Кнопка плюс/крестик */}
        <TouchableOpacity 
            onPress={toggleFab}
          style={{ 
            width: 56, 
            height: 56, 
            borderRadius: 28, 
            backgroundColor: '#5E35B1',
            justifyContent: 'center',
            alignItems: 'center',
              elevation: 8,
            shadowColor: '#5E35B1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
              zIndex: 3,
          }}
            activeOpacity={0.85}
        >
            <Ionicons name={fabOpen ? 'close' : 'add'} size={28} color="white" />
        </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', position: 'relative' }}
          onPress={() => { setFabOpen(false); handleNotificationsPress(); }}
        >
          <Ionicons name="notifications" size={24} color={state.index === 2 ? '#5E35B1' : '#757575'} />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: '50%',
              marginRight: -16,
              backgroundColor: '#F44336',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
                textAlign: 'center',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center' }}
          onPress={() => { setFabOpen(false); router.push('/profile'); }}
        >
          <Ionicons name="person" size={24} color={state.index === 3 ? '#5E35B1' : '#757575'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <>
      <Stack.Screen
        name="screens/TransactionsScreen"
        options={{
          headerTitle: '',
          headerBackTitle: 'Back',
          headerTintColor: '#212121',
          headerShadowVisible: false
        }}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }
        }}
        tabBar={props => <CustomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="monthly-report"
          options={{
            title: 'Reports',
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            headerShown: true,
            headerTitle: 'Notifications',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
            },
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerShadowVisible: false,
            headerButtons: {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            },
            clearAllButton: {
              backgroundColor: '#F44336',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 4,
              minWidth: 90,
              alignItems: 'center',
              marginRight: 8,
              marginBottom: 0,
            },
            markAllButton: {
              backgroundColor: '#2196F3',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 4,
              minWidth: 90,
              alignItems: 'center',
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}