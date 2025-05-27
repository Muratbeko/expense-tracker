import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from 'react-native';
import { TransactionProvider } from './contexts/TransactionContext';
import { configureNotifications } from './utils/notifications';

const StackLayout = () => {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/TransactionsScreen"
        options={{
          headerShown: true,
          title: 'Transactions',
        }}
      />
      <Stack.Screen
        name="(modals)"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="receipt-scanner"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="voice-transaction"
        options={{
          title: 'Голосовой ввод',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <TransactionProvider>
          <StackLayout />
        </TransactionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}