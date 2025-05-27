import apiService from '@/app/services/api';
import { TransactionType } from '@/app/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function TransactionDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const data = await apiService.getTransaction(id as string);
      setTransaction(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTransaction(id as string);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete transaction');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/transaction/edit/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text>Transaction not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5E35B1" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount,
            { color: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336' }
          ]}>
            {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount}
          </Text>
          <Text style={styles.type}>{transaction.type}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{transaction.description}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{transaction.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {new Date(transaction.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  type: {
    fontSize: 16,
    color: '#757575',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#757575',
  },
  value: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#5E35B1',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 