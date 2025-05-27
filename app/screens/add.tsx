import apiService from '@/app/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function AddTransactionScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'EXPENSE'
  });

  const handleSave = async () => {
    try {
      if (!formData.amount || !formData.description || !formData.category) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const transaction = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
        userId: '1', // This should come from authentication
        walletId: '1' // This should come from user's selected wallet
      };

      await apiService.createTransaction(transaction as any);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create transaction');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5E35B1" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={formData.amount}
            onChangeText={(value) => setFormData({ ...formData, amount: value })}
            keyboardType="numeric"
            placeholder="Enter amount"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(value) => setFormData({ ...formData, description: value })}
            placeholder="Enter description"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => setFormData({ ...formData, category: value })}
            placeholder="Enter category"
          />
        </View>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.type === 'EXPENSE' && styles.selectedType
            ]}
            onPress={() => setFormData({ ...formData, type: 'EXPENSE' })}
          >
            <Text style={[
              styles.typeButtonText,
              formData.type === 'EXPENSE' && styles.selectedTypeText
            ]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.type === 'INCOME' && styles.selectedType
            ]}
            onPress={() => setFormData({ ...formData, type: 'INCOME' })}
          >
            <Text style={[
              styles.typeButtonText,
              formData.type === 'INCOME' && styles.selectedTypeText
            ]}>Income</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Transaction</Text>
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5E35B1',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedType: {
    backgroundColor: '#5E35B1',
  },
  typeButtonText: {
    color: '#5E35B1',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#5E35B1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 