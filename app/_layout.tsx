import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { configureNotifications } from './utils/notifications';

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(tabs)"
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
        name="(modals)/profileModal"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(modals)/WalletScreen"
        options={{
          presentation: "modal",
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
        <StackLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}