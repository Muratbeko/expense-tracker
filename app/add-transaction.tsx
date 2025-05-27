import { Transaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTransaction } from '../contexts/TransactionContext';

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addTransaction } = useTransaction() as { addTransaction: (transaction: Transaction) => Promise<void> };
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('EXPENSE');

  useEffect(() => {
    console.log('Получены параметры:', params);
    if (params) {
      if (params.amount) {
        console.log('Устанавливаем сумму:', params.amount);
        setAmount(params.amount as string);
      }
      if (params.description) {
        console.log('Устанавливаем описание:', params.description);
        setDescription(params.description as string);
      }
      if (params.category) {
        console.log('Устанавливаем категорию:', params.category as string);
        setCategory(params.category as string);
      }
      if (params.type) {
        console.log('Устанавливаем тип:', params.type);
        setType(params.type as string);
      }
    }
  }, [params]);

  const handleAddTransaction = async () => {
    console.log('Попытка добавления транзакции:', { amount, description, category, type });
    
    // Проверяем все поля
    if (!amount || !description || !category) {
      Alert.alert(
        'Ошибка', 
        'Пожалуйста, заполните все поля:\n' +
        (!amount ? '- Сумма\n' : '') +
        (!description ? '- Описание\n' : '') +
        (!category ? '- Категория' : '')
      );
      return;
    }

    // Проверяем, что сумма - это число
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    try {
      const newTransaction = {
        id: Date.now().toString(),
        amount: numericAmount,
        description: description.trim(),
        category: category.trim(),
        date: new Date().toISOString(),
        type: type,
      };

      console.log('Создаем транзакцию:', newTransaction);
      
      // Добавляем транзакцию и ждем завершения
      const result = await addTransaction(newTransaction as Transaction);
      
      if (result) {
        console.log('Транзакция успешно добавлена');
        
        // Показываем подтверждение
        Alert.alert(
          'Успешно', 
          'Транзакция добавлена!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Очищаем поля
                setAmount('');
                setDescription('');
                setCategory('');
                setType('EXPENSE');
                
                // Возвращаемся на предыдущую страницу (главную с tabs)
                router.back();
              }
            }
          ]
        );
      } else {
        throw new Error('Не удалось добавить транзакцию');
      }
      
    } catch (error) {
      console.error('Ошибка при добавлении транзакции:', error);
      Alert.alert('Ошибка', 'Не удалось добавить транзакцию: ' + error.message);
    }
  };

  const handleScanReceipt = () => {
    router.push('/receipt-scanner');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Переключатель типа транзакции */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'EXPENSE' ? styles.expenseActive : styles.typeInactive
            ]}
            onPress={() => setType('EXPENSE')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'EXPENSE' ? styles.typeActiveText : styles.typeInactiveText
            ]}>
              Расход
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'INCOME' ? styles.incomeActive : styles.typeInactive
            ]}
            onPress={() => setType('INCOME')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'INCOME' ? styles.typeActiveText : styles.typeInactiveText
            ]}>
              Доход
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Сумма</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Введите сумму"
          returnKeyType="next"
        />

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Введите описание"
          returnKeyType="next"
        />

        <Text style={styles.label}>Категория</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Введите категорию"
          returnKeyType="done"
        />

        {/* Показываем кнопку сканирования только для расходов */}
        {type === 'EXPENSE' && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanReceipt}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.scanButtonText}>Сканировать чек</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            (!amount || !description || !category) && styles.addButtonDisabled
          ]}
          onPress={handleAddTransaction}
          disabled={!amount || !description || !category}
        >
          <Text style={styles.addButtonText}>
            {type === 'EXPENSE' ? 'Добавить расход' : 'Добавить доход'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  typeInactive: {
    backgroundColor: '#f8f8f8',
  },
  expenseActive: {
    backgroundColor: '#FF3B30',
  },
  incomeActive: {
    backgroundColor: '#34C759',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeActiveText: {
    color: 'white',
  },
  typeInactiveText: {
    color: '#666',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
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