import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import { Stack, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.0.109:8080';

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Загружаем количество непрочитанных уведомлений при монтировании
    loadUnreadCount();

    // Обновляем каждые 30 секунд (можно настроить интервал)
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/notifications/unread/count`);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleAddPress = () => {
    // Navigate to index and trigger modal opening
    navigation.navigate('index', { openAddModal: true });
  };

  const handleNotificationsPress = () => {
    navigation.navigate('notifications');
    // Обновляем счетчик после навигации
    setTimeout(loadUnreadCount, 1000);
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
          onPress={() => navigation.navigate('index')}
        >
          <Ionicons name="home" size={24} color={state.index === 0 ? '#5E35B1' : '#757575'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center' }}
          onPress={() => navigation.navigate('wallet')}
        >
          <Ionicons name="wallet" size={24} color={state.index === 1 ? '#5E35B1' : '#757575'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ 
            width: 56, 
            height: 56, 
            borderRadius: 28, 
            backgroundColor: '#5E35B1',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -20,
            shadowColor: '#5E35B1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={handleAddPress}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', position: 'relative' }}
          onPress={handleNotificationsPress}
        >
          <Ionicons name="notifications" size={24} color={state.index === 2 ? '#5E35B1' : '#757575'} />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: '35%',
              backgroundColor: '#F44336',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 11,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center' }}
          onPress={() => navigation.navigate('profile')}
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