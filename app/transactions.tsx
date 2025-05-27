import { useRouter } from 'expo-router';
import React from 'react';
import TransactionsScreen from './screens/TransactionsScreen';

export default function Transactions() {
  const router = useRouter();
  
  return <TransactionsScreen navigation={router} />;
} 