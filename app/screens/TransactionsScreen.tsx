import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { TransactionType } from '../../types';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.0.109:8080';

const screenWidth = Dimensions.get('window').width;

interface GroupedTransactions {
  [key: string]: TransactionType[];
}

interface ChartData {
  labels: string[];
  datasets: [{
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }];
}

type PeriodFilter = 'week' | 'month' | 'year';
type SortOption = 'date' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

const TransactionsScreen = ({ navigation }: { navigation: any }) => {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterAndSortTransactions();
  }, [transactions, periodFilter, sortBy, sortDirection]);

  useEffect(() => {
    generateChartData();
  }, [filteredTransactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/transactions`);
      const allTxns = response.data as TransactionType[] || [];
      setTransactions(allTxns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTransactions = () => {
    let filtered = [...transactions];
    const now = new Date();
    const startDate = new Date();

    // Apply period filter
    switch (periodFilter) {
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

    filtered = filtered.filter(transaction => 
      new Date(transaction.date) >= startDate
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredTransactions(filtered);
  };

  const generateChartData = () => {
    if (filteredTransactions.length === 0) {
      setChartData(null);
      return;
    }

    // Group transactions by date for chart
    const dailyData: { [key: string]: number } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      
      // Calculate net flow (income - expenses)
      if (transaction.type === 'INCOME') {
        dailyData[date] += transaction.amount;
      } else {
        dailyData[date] -= transaction.amount;
      }
    });

    // Sort dates and prepare chart data
    const sortedDates = Object.keys(dailyData).sort();
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    const data = sortedDates.map(date => dailyData[date]);

    setChartData({
      labels: labels.slice(-7), // Show last 7 data points
      datasets: [{
        data: data.slice(-7),
        color: (opacity = 1) => `rgba(94, 53, 177, ${opacity})`,
        strokeWidth: 2
      }]
    });
  };

  const formatCurrency = (value: number): string => {
    return `$${parseFloat(value?.toString() || '0').toFixed(2)}`;
  };

  const getDateLabel = (date: string): string => {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (transactionDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (transactionDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return transactionDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const groupTransactionsByDate = (transactionList: TransactionType[]): GroupedTransactions => {
    return transactionList.reduce((groups: GroupedTransactions, transaction) => {
      const dateLabel = getDateLabel(transaction.date);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(transaction);
      return groups;
    }, {});
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

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => {
          if (sortBy === 'date') {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy('date');
            setSortDirection('desc');
          }
        }}
      >
        <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
          Date {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => {
          if (sortBy === 'amount') {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy('amount');
            setSortDirection('desc');
          }
        }}
      >
        <Text style={[styles.sortButtonText, sortBy === 'amount' && styles.sortButtonTextActive]}>
          Amount {sortBy === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => {
          if (sortBy === 'category') {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy('category');
            setSortDirection('asc');
          }
        }}
      >
        <Text style={[styles.sortButtonText, sortBy === 'category' && styles.sortButtonTextActive]}>
          Category {sortBy === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransactionItem = (transaction: TransactionType) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: transaction.type === 'INCOME' ? '#E8F5E8' : '#FFF3F3' }
      ]}>
        <Ionicons 
          name={transaction.type === 'INCOME' ? 'arrow-down' : 'arrow-up'} 
          size={20} 
          color={transaction.type === 'INCOME' ? '#4CAF50' : '#F44336'} 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{transaction.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
          <Text style={styles.transactionSeparator}>•</Text>
          <Text style={styles.transactionTime}>
            {new Date(transaction.date).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
      <View style={styles.transactionAmount}>
        <Text 
          style={[
            styles.transactionAmountText,
            { color: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336' }
          ]}
        >
          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </View>
  );

  const renderTransactions = () => {
    if (filteredTransactions.length === 0) {
      return <Text style={styles.noDataText}>No transactions found for this period</Text>;
    }

    const groupedTransactions = groupTransactionsByDate(filteredTransactions);

    return Object.entries(groupedTransactions).map(([dateLabel, dayTransactions]) => (
      <View key={dateLabel}>
        <Text style={styles.dateGroupHeader}>{dateLabel}</Text>
        {dayTransactions.map(renderTransactionItem)}
      </View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#5E35B1" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Filter */}
        {renderPeriodFilter()}

        {/* Chart */}
        {chartData && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Cash Flow Trend</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 32}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(94, 53, 177, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#5E35B1'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Sort Options */}
        {renderSortOptions()}

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{filteredTransactions.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {formatCurrency(
                filteredTransactions
                  .filter(t => t.type === 'INCOME')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {formatCurrency(
                filteredTransactions
                  .filter(t => t.type === 'EXPENSE')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </Text>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          {renderTransactions()}
        </View>
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sortLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  sortButtonTextActive: {
    color: '#5E35B1',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
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
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
  dateGroupHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E35B1',
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  transactionSeparator: {
    fontSize: 12,
    color: '#9E9E9E',
    marginHorizontal: 6,
  },
  transactionTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TransactionsScreen;