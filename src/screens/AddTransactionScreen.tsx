import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types/Transaction';

type RouteParams = {
  amount?: string;
  description?: string;
  category?: string;
};

export const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { addTransaction } = useTransactions();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (route.params) {
      if (route.params.amount) setAmount(route.params.amount);
      if (route.params.description) setDescription(route.params.description);
      if (route.params.category) setCategory(route.params.category);
    }
  }, [route.params]);

  const handleAddTransaction = () => {
    if (amount && description && category) {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        description,
        category,
        date: new Date().toISOString(),
      };
      addTransaction(newTransaction);
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Сумма</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Введите сумму"
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Введите описание"
        />

        <Text style={styles.label}>Категория</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Введите категорию"
        />

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('ReceiptScanner')}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.scanButtonText}>Сканировать чек</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTransaction}
        >
          <Text style={styles.addButtonText}>Добавить</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 