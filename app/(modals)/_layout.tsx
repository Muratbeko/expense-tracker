import { Stack } from 'expo-router';
import React from 'react';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="profileModal"
        options={{
          title: 'Профиль',
        }}
      />
      <Stack.Screen
        name="WalletScreen"
        options={{
          title: 'Кошелек',
        }}
      />
    </Stack>
  );
} 