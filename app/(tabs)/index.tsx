import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { NotificationProvider } from '@/contexts/NotificationContext';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AddGoalModal } from '../(modals)/AddGoalModal';
import { AddTransactionModal } from '../(modals)/AddTransactionModal';
import { EditBudgetModal } from '../(modals)/EditBudgetModal';
import type { TransactionType } from '../../types';
import { BudgetNotification } from '../components/BudgetNotification';
import TopUpModal from '../components/TopUpModal';

// API configuration with timeout
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.0.109:8080';

// Configure axios with timeout
axios.defaults.timeout = 10000; // 10 seconds timeout

interface SavingGoal {
  id?: number;
  name: string;
  description?: string;
  currentAmount: number;
  targetAmount: number;
  targetDate?: string;
  imageUrl?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  createdAt?: string;
}

interface Budget {
  id: number;
  month: string;
  year: number;
  total: number;
  spent: number;
  categories: Array<{
    id: number;
    name: string;
    budget: number;
    spent: number;
  }>;
}

interface GroupedTransactions {
  [key: string]: TransactionType[];
}

const HomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [allTransactions, setAllTransactions] = useState<TransactionType[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddTransactionVisible, setIsAddTransactionVisible] = useState(false);
  const [isAddGoalVisible, setIsAddGoalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (params.openAddModal === 'true') {
      setIsAddTransactionVisible(true);
      // Clear the parameter after using it
      router.setParams({ openAddModal: 'false' });
    }
  }, [params.openAddModal]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data with error handling for each request
      const results = await Promise.allSettled([
        fetchAccountBalance(),
        fetchBudget(),
        fetchSavingGoals(),
        fetchTransactions()
      ]);

      // Check if any requests failed
      const failedRequests = results.filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn('Some requests failed:', failedRequests);
        setError('Some data could not be loaded. Please check your connection.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAccountBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/accounts/balance`);
      const data = response.data as { balance: number; income: number; expenses: number };
      setBalance(data.balance || 0);
      setIncome(data.income || 0);
      setExpenses(data.expenses || 0);
    } catch (error) {
      console.error('Error fetching account balance:', error);
      // Set default values instead of throwing
      setBalance(0);
      setIncome(0);
      setExpenses(0);
    }
  };
  
  const fetchBudget = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/budgets/current`);
      setBudget(response.data as Budget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      setBudget(null);
    }
  };
  
  const createDefaultBudget = async () => {
    try {
      const currentDate = new Date();
      const response = await axios.post(`${API_BASE_URL}/api/budgets`, {
        month: currentDate.toLocaleString('default', { month: 'long' }),
        year: currentDate.getFullYear(),
        total: 1000,
        spent: 0
      });
      setBudget(response.data as Budget);
      Alert.alert('Success', 'Budget created! You can now edit it.');
    } catch (error) {
      console.error('Error creating budget:', error);
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    }
  };
  
  const fetchSavingGoals = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/goals`);
      setSavingGoals(response.data as SavingGoal[] || []);
    } catch (error) {
      console.error('Error fetching saving goals:', error);
      setSavingGoals([]);
    }
  };
  
  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions`);
      const allTxns = response.data as TransactionType[] || [];
      
      // Sort transactions by date (newest first)
      const sortedTransactions = allTxns.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAllTransactions(sortedTransactions);
      setTransactions(sortedTransactions.slice(0, 5)); // Show only 5 recent
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setAllTransactions([]);
    }
  };

  const handleEditBudget = () => {
    if (!budget) {
      Alert.alert('Error', 'No budget found. Creating a new budget...');
      createDefaultBudget();
      return;
    }
    setIsEditModalVisible(true);
  };

  const handleSaveBudget = async (newBudgetTotal: number) => {
    try {
      if (!budget?.id) {
        Alert.alert('Error', 'No budget to update');
        return;
      }
      
      if (!newBudgetTotal || newBudgetTotal <= 0) {
        Alert.alert('Error', 'Please enter a valid budget amount');
        return;
      }
      
      const response = await axios.put(`${API_BASE_URL}/api/budgets/${budget.id}`, {
        total: newBudgetTotal
      });
      setBudget(response.data as Budget);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Budget updated successfully');
    } catch (error) {
      console.error('Error updating budget:', error);
      Alert.alert('Error', 'Failed to update budget. Please try again.');
    }
  };

  const handleAddGoal = async (goalData: Partial<SavingGoal>) => {
    if (!goalData.name || !goalData.targetAmount || goalData.targetAmount <= 0) {
      Alert.alert('Error', 'Please fill in all required fields with valid values');
      return;
    }

    try {
      const payload = {
        name: goalData.name,
        description: goalData.description || '',
        targetAmount: goalData.targetAmount,
        currentAmount: 0,
        targetDate: goalData.targetDate || null,
        priority: goalData.priority || 'MEDIUM',
        category: goalData.category || 'General',
        imageUrl: goalData.imageUrl || null
      };

      const response = await axios.post(`${API_BASE_URL}/api/goals`, payload);
      setSavingGoals([...savingGoals, response.data as SavingGoal]);
      setIsAddGoalVisible(false);
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal. Please try again.');
    }
  };

  const updateGoalProgress = async (goalId: number, newAmount: number) => {
    if (newAmount < 0) {
      Alert.alert('Error', 'Amount cannot be negative');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/api/goals/${goalId}`, {
        currentAmount: newAmount
      });
      setSavingGoals(savingGoals.map((goal): SavingGoal => 
        goal.id === goalId ? response.data as SavingGoal : goal
      ));
      Alert.alert('Success', 'Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const deleteGoal = async (goalId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/goals/${goalId}`);
      setSavingGoals(savingGoals.filter(goal => goal.id !== goalId));
      Alert.alert('Success', 'Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Error', 'Failed to delete goal. Please try again.');
    }
  };

  const formatCurrency = (value: number): string => {
    return `$${parseFloat(value?.toString() || '0').toFixed(2)}`;
  };

  const getMonthName = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  const getDateLabel = (date: string): string => {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
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

  const handleSeeAllTransactions = () => {
    router.push('/screens/TransactionsScreen');
  };

  const handleSeeAllGoals = () => {
    router.push('/screens/SavingGoalScreen');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'flame';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'leaf';
      default: return 'bookmark';
    }
  };

  // Fixed function to properly construct image URLs
  const getGoalImageUrl = (goal: SavingGoal): string | null => {
    if (!goal.imageUrl) return null;
    
    // If it's already a full URL, return as is
    if (goal.imageUrl.startsWith('http')) {
      return goal.imageUrl;
    }
    
    // Otherwise, construct the full URL with the API base
    return `${API_BASE_URL}/api/goals/images/${goal.imageUrl}`;
  };

  const renderBudget = () => {
    if (!budget) {
      return (
        <View>
          <Text style={styles.budgetText}>No budget set for this month</Text>
          <TouchableOpacity 
            style={styles.createBudgetButton}
            onPress={createDefaultBudget}
          >
            <Text style={styles.createBudgetText}>Create Budget</Text>
          </TouchableOpacity>
        </View>
      );
    }
  
    if (typeof budget.total !== 'number' || typeof budget.spent !== 'number') {
      return (
        <Text style={styles.budgetText}>Invalid budget data</Text>
      );
    }
  
    return (
      <>
        <Text style={styles.budgetText}>
          {formatCurrency(budget.spent)} of {formatCurrency(budget.total)}
        </Text>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.min((budget.spent / budget.total) * 100, 100)}%`,
                backgroundColor: budget.spent > budget.total ? '#F44336' : '#5E35B1'
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.percentageText,
          { color: budget.spent > budget.total ? '#F44336' : '#757575' }
        ]}>
          {((budget.spent / budget.total) * 100).toFixed(1)}% used
          {budget.spent > budget.total && ' - Over budget!'}
        </Text>
      </>
    );
  };

  const renderTransactionItem = (transaction: TransactionType) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
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
    const transactionsToShow = showAllTransactions ? allTransactions : transactions;
    
    if (!Array.isArray(transactionsToShow) || transactionsToShow.length === 0) {
      return <Text style={styles.noDataText}>No transactions yet</Text>;
    }

    const groupedTransactions = groupTransactionsByDate(transactionsToShow);

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
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <NotificationProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={fetchAllData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {budget && <BudgetNotification budget={budget} />}

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>Total Balance</Text>
              <TouchableOpacity onPress={fetchAllData}>
                <Ionicons name="refresh" size={20} color="#757575" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            <View style={styles.balanceDetails}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemIcon}>↓</Text>
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={[styles.balanceItemValue, { color: '#4CAF50' }]}>{formatCurrency(income)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemIcon}>↑</Text>
                <Text style={styles.balanceItemLabel}>Expense</Text>
                <Text style={[styles.balanceItemValue, { color: '#F44336' }]}>{formatCurrency(expenses)}</Text>
              </View>
            </View>
          </View>
          
          {/* Budget Progress */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{getMonthName()} Budget</Text>
              <TouchableOpacity onPress={handleEditBudget}>
                <Ionicons name="pencil" size={20} color="#5E35B1" />
              </TouchableOpacity>
            </View>
            {renderBudget()}
          </View>

          {/* Feature Categories */}
          <View style={styles.categoriesGrid}>
            <TouchableOpacity 
              style={styles.categorySquare}
              onPress={() => router.push('/screens/SpendingByCategoryScreen')}
            >
              <Ionicons name="pie-chart" size={28} color="#5E35B1" />
              <Text style={styles.categoryText}>Spending by Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categorySquare}>
              <Ionicons name="bar-chart" size={28} color="#5E35B1" />
              <Text style={styles.categoryText}>Budget Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categorySquare}
              onPress={handleSeeAllGoals}
            >
              <Ionicons name="flag" size={28} color="#5E35B1" />
              <Text style={styles.categoryText}>Saving Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.categorySquare}
              onPress={handleSeeAllTransactions}
            >
              <Ionicons name="calendar" size={28} color="#5E35B1" />
              <Text style={styles.categoryText}>Transactions</Text>
            </TouchableOpacity>
          </View>

          {/* Saving Goals */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saving Goals</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleSeeAllGoals} style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsAddGoalVisible(true)}>
                  <Ionicons name="add" size={20} color="#5E35B1" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsScrollView}>
              {Array.isArray(savingGoals) && savingGoals.length > 0 ? (
                savingGoals.slice(0, 3).map((goal) => {
                  const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                  const isCompleted = goal.currentAmount >= goal.targetAmount;
                  const imageUrl = getGoalImageUrl(goal);
                  
                  return (
                    <TouchableOpacity 
                      key={goal.id} 
                      style={[styles.goalCard, isCompleted && styles.completedGoalCard]}
                      onPress={() => router.push({ pathname: '/screens/GoalDetailScreen', params: { goalId: goal.id } })}
                    >
                      {imageUrl && (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.goalImage}
                          resizeMode="cover"
                          onError={(error) => {
                            console.warn('Image failed to load:', error.nativeEvent.error);
                            console.warn('Image URL:', imageUrl);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', imageUrl);
                          }}
                        />
                      )}
                      <View style={styles.goalHeader}>
                        <View style={styles.goalPriorityContainer}>
                          <Ionicons 
                            name={getPriorityIcon(goal.priority)} 
                            size={14} 
                            color={getPriorityColor(goal.priority)} 
                          />
                          <Text style={[styles.goalPriority, { color: getPriorityColor(goal.priority) }]}>
                            {goal.priority}
                          </Text>
                        </View>
                        {isCompleted && (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.goalTitle} numberOfLines={2}>{goal.name}</Text>
                      {goal.description && (
                        <Text style={styles.goalDescription} numberOfLines={2}>{goal.description}</Text>
                      )}
                      
                      <Text style={[styles.goalAmount, isCompleted && styles.completedAmount]}>
                        {formatCurrency(goal.currentAmount)}
                      </Text>
                      
                      <View style={styles.goalProgressContainer}>
                        <View style={styles.goalProgressTrack}>
                          <View 
                            style={[
                              styles.goalProgress, 
                              { 
                                width: `${progressPercentage}%`,
                                backgroundColor: isCompleted ? '#4CAF50' : '#5E35B1'
                              }
                            ]} 
                          />
                        </View>
                      </View>
                      
                      <View style={styles.goalFooter}>
                        <Text style={[styles.goalPercentage, isCompleted && styles.completedText]}>
                          {progressPercentage.toFixed(0)}% of {formatCurrency(goal.targetAmount)}
                        </Text>
                        {goal.targetDate && (
                          <Text style={styles.goalDate}>
                            {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                        )}
                      </View>
                      
                      <Text style={styles.goalCategory}>{goal.category}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noGoalsContainer}>
                  <Ionicons name="flag-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.noDataText}>No saving goals yet</Text>
                  <Text style={styles.noDataSubtext}>Tap + to create your first goal!</Text>
                </View>
              )}
            </ScrollView>
          </View>
          
          {/* Recent Transactions */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {showAllTransactions ? 'All Transactions' : 'Recent Transactions'}
              </Text>
              <TouchableOpacity onPress={handleSeeAllTransactions}>
                <Text style={styles.moreButton}>
                  {showAllTransactions ? 'Show Less' : 'See All'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderTransactions()}
          </View>
        </ScrollView>
        
        {/* Floating Add Button */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setIsAddTransactionVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>

        {/* Modals */}
        <EditBudgetModal
          visible={isEditModalVisible}
          budget={budget}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={handleSaveBudget}
        />

        <AddGoalModal
          visible={isAddGoalVisible}
          onClose={() => setIsAddGoalVisible(false)}
          onSave={handleAddGoal}
        />

        <AddTransactionModal
          visible={isAddTransactionVisible}
          onClose={() => setIsAddTransactionVisible(false)}
          onSuccess={fetchAllData}
          apiBaseUrl={API_BASE_URL}
        />

        <TopUpModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          goal={savingGoals.find(g => g.id === Number(params.goalId)) || {} as SavingGoal}
          onSuccess={() => {
            setModalVisible(false);
            fetchAllData();
          }}
        />
      </SafeAreaView>
    </NotificationProvider>
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
  errorBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderColor: '#FFEAA7',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#856404',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#5E35B1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createBudgetButton: {
    backgroundColor: '#5E35B1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  createBudgetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceItemIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seeAllButton: {
    paddingHorizontal: 8,
  },
  seeAllText: {
    color: '#5E35B1',
    fontSize: 14,
    fontWeight: '600',
  },
  budgetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  progressContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    height: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    color: '#757575',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categorySquare: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  goalsScrollView: {
    marginBottom: 8,
  },
  goalCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  completedGoalCard: {
    backgroundColor: '#F0F8F0',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalPriorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalPriority: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  goalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5E35B1',
    marginBottom: 8,
  },
  completedAmount: {
    color: '#4CAF50',
  },
  goalProgressContainer: {
    marginBottom: 8,
  },
  goalProgressTrack: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
  },
  goalProgress: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalPercentage: {
    fontSize: 10,
    color: '#757575',
    flex: 1,
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  goalDate: {
    fontSize: 10,
    color: '#5E35B1',
    fontWeight: '500',
  },
  goalCategory: {
    fontSize: 10,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  noGoalsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  dateGroupHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
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
    color: '#333333',
    marginBottom: 2,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#757575',
  },
  transactionSeparator: {
    fontSize: 12,
    color: '#CCCCCC',
    marginHorizontal: 6,
  },
  transactionTime: {
    fontSize: 12,
    color: '#757575',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreButton: {
    color: '#5E35B1',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5E35B1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  goalImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
});

export default HomeScreen;