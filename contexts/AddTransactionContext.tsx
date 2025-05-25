import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

// Context для управления модалом добавления транзакции
interface AddTransactionContextType {
  isAddTransactionVisible: boolean;
  setIsAddTransactionVisible: (visible: boolean) => void;
}

const AddTransactionContext = createContext<AddTransactionContextType | undefined>(undefined);

export const useAddTransaction = () => {
  const context = useContext(AddTransactionContext);
  if (!context) {
    throw new Error('useAddTransaction must be used within AddTransactionProvider');
  }
  return context;
};

// Provider для контекста
export const AddTransactionProvider = ({ children }: { children: ReactNode }) => {
  const [isAddTransactionVisible, setIsAddTransactionVisible] = useState(false);

  return (
    <AddTransactionContext.Provider value={{
      isAddTransactionVisible,
      setIsAddTransactionVisible
    }}>
      {children}
    </AddTransactionContext.Provider>
  );
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { setIsAddTransactionVisible } = useAddTransaction();

  // Функция для получения правильного индекса без учета центральной кнопки
  const getTabIndex = (routeIndex: number) => {
    return routeIndex;
  };

  // Функция для определения активной вкладки
  const isTabActive = (tabIndex: number) => {
    const currentRouteIndex = state.index;
    return currentRouteIndex === tabIndex;
  };

  const handleAddTransaction = () => {
    // Если мы не на главном экране, сначала переходим туда
    if (state.index !== 0) {
      navigation.navigate('index');
    }
    // Открываем модал добавления транзакции
    setIsAddTransactionVisible(true);
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      backgroundColor: '#FFFFFF', 
      borderTopWidth: 1, 
      borderTopColor: '#EEEEEE',
      height: 80,
      paddingBottom: 20,
      paddingTop: 10
    }}>
      <View style={{ 
        flex: 1, 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        alignItems: 'center'
      }}>
        {/* Home Tab */}
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
          onPress={() => navigation.navigate('index')}
        >
          <Ionicons 
            name={isTabActive(0) ? "home" : "home-outline"} 
            size={24} 
            color={isTabActive(0) ? '#5E35B1' : '#757575'} 
          />
        </TouchableOpacity>

        {/* Wallet Tab */}
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
          onPress={() => navigation.navigate('wallet')}
        >
          <Ionicons 
            name={isTabActive(1) ? "wallet" : "wallet-outline"} 
            size={24} 
            color={isTabActive(1) ? '#5E35B1' : '#757575'} 
          />
        </TouchableOpacity>

        {/* Central Add Button - Функциональная кнопка для добавления транзакций */}
        <TouchableOpacity 
          style={{ 
            width: 56, 
            height: 56, 
            borderRadius: 28, 
            backgroundColor: '#5E35B1',
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 10,
            shadowColor: '#5E35B1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={handleAddTransaction}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>

        {/* Notifications Tab */}
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
          onPress={() => navigation.navigate('notifications')}
        >
          <Ionicons 
            name={isTabActive(2) ? "notifications" : "notifications-outline"} 
            size={24} 
            color={isTabActive(2) ? '#5E35B1' : '#757575'} 
          />
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity 
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
          onPress={() => navigation.navigate('profile')}
        >
          <Ionicons 
            name={isTabActive(3) ? "person" : "person-outline"} 
            size={24} 
            color={isTabActive(3) ? '#5E35B1' : '#757575'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <AddTransactionProvider>
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
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </AddTransactionProvider>
  );
}