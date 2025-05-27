// app/(modals)/AddTransactionModalProps.tsx
import { apiClient } from '@/api';
import Typo from '@/components/Typo';
import { colors } from '@/constants/theme';
import apiService from '@/services/api';
import { Category } from '@/types/index';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onTransactionAdded,
}) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.data as Category[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories if API fails
      setCategories([
        { id: 1, name: 'Food', type: 'EXPENSE', icon: 'fast-food-outline', color: '#FF6B6B' },
        { id: 2, name: 'Transportation', type: 'EXPENSE', icon: 'car-outline', color: '#4ECDC4' },
        { id: 3, name: 'Entertainment', type: 'EXPENSE', icon: 'film-outline', color: '#45B7D1' },
        { id: 4, name: 'Utilities', type: 'EXPENSE', icon: 'bulb-outline', color: '#F9CA24' },
        { id: 5, name: 'Healthcare', type: 'EXPENSE', icon: 'medical-outline', color: '#F0932B' },
        { id: 6, name: 'Shopping', type: 'EXPENSE', icon: 'cart-outline', color: '#EB4D4B' },
        { id: 7, name: 'Education', type: 'EXPENSE', icon: 'school-outline', color: '#6C5CE7' },
        { id: 8, name: 'Salary', type: 'INCOME', icon: 'cash-outline', color: '#00B894' },
        { id: 9, name: 'Investment', type: 'INCOME', icon: 'trending-up-outline', color: '#00CEC9' },
        { id: 10, name: 'Gift', type: 'INCOME', icon: 'gift-outline', color: '#E17055' },
        { id: 11, name: 'Other', type: 'INCOME', icon: 'list-outline', color: '#74B9FF' },
        { id: 12, name: 'Other', type: 'EXPENSE', icon: 'list-outline', color: '#A29BFE' },
      ]);
    }
  };

  const resetForm = () => {
    setType('EXPENSE');
    setCategory('');
    setAmount('');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddTransaction = async () => {
    // Validate inputs
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await apiService.createTransaction({
        type,
        category,
        amount: amountValue,
        description,
        date: new Date().toISOString(),
        walletId: 1, // Default wallet ID
      });

      Alert.alert('Success', 'Transaction added successfully');
      resetForm();
      onTransactionAdded();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'Food': 'fast-food-outline',
      'Transportation': 'car-outline',
      'Entertainment': 'film-outline',
      'Utilities': 'bulb-outline',
      'Healthcare': 'medical-outline',
      'Shopping': 'cart-outline',
      'Education': 'school-outline',
      'Salary': 'cash-outline',
      'Investment': 'trending-up-outline',
      'Gift': 'gift-outline',
      'Other': 'list-outline',
    };
    return iconMap[categoryName] || 'list-outline';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typo size={20} fontWeight="700" color={colors.darkText}>
              Add Transaction
            </Typo>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.darkText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Transaction Type */}
            <View style={styles.section}>
              <Typo size={16} fontWeight="600" color={colors.darkText}>
                Transaction Type
              </Typo>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    type === 'EXPENSE' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setType('EXPENSE')}
                >
                  <Typo
                    size={14}
                    color={type === 'EXPENSE' ? colors.white : colors.darkText}
                  >
                    Expense
                  </Typo>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    type === 'INCOME' && styles.segmentButtonActive,
                  ]}
                  onPress={() => setType('INCOME')}
                >
                  <Typo
                    size={14}
                    color={type === 'INCOME' ? colors.white : colors.darkText}
                  >
                    Income
                  </Typo>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Typo size={16} fontWeight="600" color={colors.darkText}>
                Amount
              </Typo>
              <View style={styles.amountInputContainer}>
                <Typo size={18} color={colors.darkText}>
                  R$
                </Typo>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Typo size={16} fontWeight="600" color={colors.darkText}>
                Category
              </Typo>
              <View style={styles.categoryGrid}>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      category === cat.name && styles.categoryItemActive,
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        category === cat.name && styles.categoryIconActive,
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(cat.name) as any}
                        size={18}
                        color={
                          category === cat.name ? colors.white : colors.primary
                        }
                      />
                    </View>
                    <Typo
                      size={12}
                      color={
                        category === cat.name ? colors.primary : colors.darkText
                      }
                    >
                      {cat.name}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Typo size={16} fontWeight="600" color={colors.darkText}>
                Description (Optional)
              </Typo>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add a note"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.addButton, loading && styles.disabledButton]}
              onPress={handleAddTransaction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Typo size={16} fontWeight="600" color={colors.white}>
                  Add Transaction
                </Typo>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 36,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  section: {
    marginBottom: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingVertical: 8,
    marginTop: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    marginLeft: 8,
    paddingVertical: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryItemActive: {
    opacity: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f7f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconActive: {
    backgroundColor: colors.primary,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default AddTransactionModal;