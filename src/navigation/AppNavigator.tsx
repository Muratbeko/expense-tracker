import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReceiptScanner } from '../screens/ReceiptScanner';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Траты',
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen}
        options={{
          title: 'Добавить трату',
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="ReceiptScanner" 
        component={ReceiptScanner}
        options={{
          title: 'Сканировать чек',
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}; 