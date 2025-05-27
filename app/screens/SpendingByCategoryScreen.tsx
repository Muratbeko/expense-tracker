import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import type { TransactionType } from '../../types';

import { API_BASE_URL } from '../config/api';

type PeriodFilter = 'week' | 'month' | 'year';

interface CategorySpending {
  category: string;
  amount: number;
  color: string;
}

const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
];

const SpendingByCategoryScreen = () => {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [loading, setLoading] = useState(true);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, [periodFilter]);

  useEffect(() => {
    calculateCategorySpending();
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/transactions`);
      const allTxns = response.data as TransactionType[] || [];
      
      // Filter transactions based on period
      const filteredTxns = filterTransactionsByPeriod(allTxns, periodFilter);
      setTransactions(filteredTxns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByPeriod = (txns: TransactionType[], period: PeriodFilter) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return txns.filter(txn => 
      new Date(txn.date) >= startDate && txn.type === 'EXPENSE'
    );
  };

  const calculateCategorySpending = () => {
    const spendingByCategory = new Map<string, number>();

    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE') {
        const categoryName = typeof transaction.category === 'object' && transaction.category !== null
          ? (transaction.category as { name: string }).name
          : String(transaction.category);
        
        const currentAmount = spendingByCategory.get(categoryName) || 0;
        spendingByCategory.set(categoryName, currentAmount + transaction.amount);
      }
    });

    const categoryData = Array.from(spendingByCategory.entries()).map(([category, amount], index) => ({
      category,
      amount,
      color: COLORS[index % COLORS.length]
    }));

    setCategorySpending(categoryData);
  };

  const formatCurrency = (value: number): string => {
    return `$${parseFloat(value?.toString() || '0').toFixed(2)}`;
  };

  const renderPeriodFilter = () => (
    <View style={styles.filterContainer}>
      {(['week', 'month', 'year'] as PeriodFilter[]).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.filterButton,
            periodFilter === period && styles.filterButtonActive
          ]}
          onPress={() => setPeriodFilter(period)}
        >
          <Text style={[
            styles.filterButtonText,
            periodFilter === period && styles.filterButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPieChart = () => {
    if (categorySpending.length === 0) {
      return <Text style={styles.noDataText}>No spending data available</Text>;
    }

    const data = categorySpending.map(item => ({
      name: item.category,
      amount: item.amount,
      color: item.color,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));

    return (
      <View style={styles.chartContainer}>
        <PieChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderCategoryList = () => (
    <View style={styles.categoryList}>
      {categorySpending.map((item, index) => (
        <View key={index} style={styles.categoryItem}>
          <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
          <Text style={styles.categoryName}>{item.category}</Text>
          <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#5E35B1" />
        <Text style={styles.loadingText}>Loading spending data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderPeriodFilter()}
        {renderPieChart()}
        {renderCategoryList()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  scrollContent: {
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#5E35B1',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    padding: 20,
  },
  categoryList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
});

export default SpendingByCategoryScreen; 