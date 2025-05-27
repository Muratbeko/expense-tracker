import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import TopUpModal from '../../components/TopUpModal';
import apiService from '../../services/api';
import type { SavingGoal, Transaction } from '../../types';

interface CircularProgressProps {
  progress: number;
  size?: number;
}

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<SavingGoal | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (goalId) {
      fetchGoalAndTransactions();
    }
  }, [goalId]);

  const fetchGoalAndTransactions = async (): Promise<void> => {
    if (!goalId) return;
    
    setLoading(true);
    try {
      // Use the apiService instead of direct axios calls
      const goalData = await apiService.getGoals();
      const foundGoal = goalData.find(g => g.id?.toString() === goalId);
      if (foundGoal) {
        setGoal(foundGoal);
      }

      const allTransactions = await apiService.getTransactions();
      const goalTransactions = allTransactions.filter(tx => 
        tx.description?.includes(foundGoal?.name || '') || 
        tx.category === 'goal' || 
        tx.description?.toLowerCase().includes('goal')
      );
      setTransactions(goalTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load goal details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoal = async (): Promise<void> => {
    if (!goalId || !goal?.id) return;

    Alert.alert(
      "Complete Goal",
      "Are you sure you want to mark this goal as completed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Complete", 
          onPress: async () => {
            try {
              await apiService.updateGoal(goal.id!.toString(), { 
                currentAmount: goal.targetAmount,
                // Add any additional completion status fields your API supports
              });
              router.back();
            } catch (error) {
              console.error('Error completing goal:', error);
              Alert.alert("Error", "Failed to complete goal");
            }
          }
        }
      ]
    );
  };

  const handleDeleteGoal = async (): Promise<void> => {
    if (!goalId || !goal?.id) return;

    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteGoal(goal.id!.toString());
              router.back();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert("Error", "Failed to delete goal");
            }
          }
        }
      ]
    );
  };

  if (loading || !goal) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const daysLeft = goal.targetDate
    ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isCompleted = progress >= 100;
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  const formatCurrency = (amount: number): string => `${amount.toFixed(2)} KGS`;

  // SVG Circle Progress Component
  const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size = 200 }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.progressContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F0F0F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FFD700"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.progressTextContainer}>
          <Text style={[styles.currentAmount, { fontWeight: 'bold', fontSize: 28 }]}>{goal.currentAmount} KGS</Text>
          {!isCompleted && remainingAmount > 0 && daysLeft !== null && (
            <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>
              Осталось {remainingAmount} KGS за {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
            </Text>
          )}
          {isCompleted && (
            <Text style={styles.completedText}>Цель достигнута!</Text>
          )}
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.iconEmoji}>💰</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>
          {item.description || 'Top up'}
        </Text>
        <Text style={styles.transactionSource}>
          wallet {item.walletId || 'default'} → {goal.name}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>+{item.amount} KGS</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString('en-GB')}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={handleDeleteGoal}>
            <Ionicons name="trash" size={20} color="#F44336" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="create" size={20} color="#5E35B1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Goal Title and Amount */}
      <View style={styles.titleSection}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={styles.targetAmount}>{goal.targetAmount} KGS</Text>
      </View>

      {/* Circular Progress */}
      <View style={styles.progressSection}>
        <CircularProgress progress={progress} />
      </View>

      {/* Transaction History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search transactions</Text>
        </View>

        {/* Today Section */}
        {transactions.length > 0 && (
          <View style={styles.todaySection}>
            <Text style={styles.todayTitle}>Recent</Text>
            <FlatList
              data={transactions.slice(0, 3)} // Show recent transactions
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={renderTransactionItem}
            />
          </View>
        )}

        {transactions.length === 0 && (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomSection}>
        {!isCompleted ? (
          <TouchableOpacity style={styles.topUpButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.topUpButtonText}>Top Up</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedButtons}>
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteGoal}>
              <Text style={styles.completeButtonText}>Complete Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TopUpModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        goal={goal}
        onSuccess={() => {
          setModalVisible(false);
          fetchGoalAndTransactions();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  goalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  targetAmount: {
    fontSize: 20,
    color: '#666',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  remainingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 25,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  todaySection: {
    marginBottom: 20,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionSource: {
    fontSize: 14,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
  bottomSection: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  topUpButton: {
    backgroundColor: '#2E3B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topUpButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedButtons: {
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});