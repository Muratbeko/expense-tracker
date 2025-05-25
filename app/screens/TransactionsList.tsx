import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  amount: number;
  description?: string;
}

const TransactionsList = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<number>(1); // Default wallet ID

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://192.168.0.109:8080/api/transactions/wallet/${selectedWalletId}`
      );
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (category: string) => {
    // Simple emoji mapping - you can replace with actual icons
    const iconMap: { [key: string]: string } = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Utilities': '💡',
      'Healthcare': '🏥',
      'Shopping': '🛍️',
      'Education': '📚',
      'Other': '📄',
    };
    return iconMap[category] || '📄';
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Typo size={24} color={colors.white}>←</Typo>
        </TouchableOpacity>
        <Typo size={20} fontWeight="700" color={colors.white}>
          Transactions
        </Typo>
        <TouchableOpacity>
          <Typo size={20} color={colors.white}>🔍</Typo>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Typo size={18} color={colors.white}>
          Transactions List (Placeholder)
        </Typo>
        
        {/* This will be populated with actual transaction data in the future */}
        {transactions.length === 0 && !loading && (
          <Typo size={16} color={colors.lightGray} style={styles.emptyText}>
            No transactions found
          </Typo>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default TransactionsList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
  },
});