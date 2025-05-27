import { apiClient } from '@/api';
import apiService from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Category, Wallet } from '../types';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
}

export default function AddTransactionModal({ visible, onClose, onTransactionAdded }: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  useEffect(() => {
    loadCategories();
    loadWallets();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.data as Category[]); 
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadWallets = async () => {
    try {
      const response = await apiClient.get('/api/wallets');
      setWallets(response.data as Wallet[]);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !description || !selectedCategory || !selectedWallet) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const transaction = {
        amount: parseFloat(amount),
        description,
        type,
        category: selectedCategory.name,
        date: date.toISOString(),
        walletId: selectedWallet.id,
      };

      await apiService.createTransaction(transaction);

      // Update wallet balance
      const balanceChange = type === 'INCOME' ? transaction.amount : -transaction.amount;
      await apiService.updateWallet(selectedWallet.id, { balance: balanceChange });

      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedWallet(null);
      setDate(new Date());
      onTransactionAdded();
      onClose();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Ошибка при добавлении транзакции');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !newCategoryIcon) {
      alert('Пожалуйста, заполните все поля категории');
      return;
    }

    try {
      const newCategory = await apiService.createCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: '#000000',
        type,
      });

      setCategories([...categories, newCategory]);
      setSelectedCategory(newCategory);
      setShowNewCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Ошибка при создании категории');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Добавить транзакцию</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'EXPENSE' && styles.selectedType]}
                onPress={() => setType('EXPENSE')}
              >
                <Text style={[styles.typeText, type === 'EXPENSE' && styles.selectedTypeText]}>
                  Расход
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'INCOME' && styles.selectedType]}
                onPress={() => setType('INCOME')}
              >
                <Text style={[styles.typeText, type === 'INCOME' && styles.selectedTypeText]}>
                  Доход
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Сумма"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Описание"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString('ru-RU')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.sectionTitle}>Выберите кошелек</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletList}>
              {wallets.map((wallet) => (
                <TouchableOpacity
                  key={wallet.id}
                  style={[
                    styles.walletItem,
                    selectedWallet?.id === wallet.id && styles.selectedWallet,
                  ]}
                  onPress={() => setSelectedWallet(wallet)}
                >
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  {wallet.balance !== undefined && (
                    <Text style={styles.walletBalance}>{wallet.balance} KGS</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Выберите категорию</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
              {categories
                .filter((cat) => cat.type === type)
                .map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory?.id === category.id && styles.selectedCategory,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Ionicons name={category.icon as any} size={24} color={category.color} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => setShowNewCategoryModal(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#666" />
                <Text style={styles.addCategoryText}>Новая категория</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
              <Text style={styles.addButtonText}>Добавить</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <Modal
          visible={showNewCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNewCategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Новая категория</Text>
                <TouchableOpacity onPress={() => setShowNewCategoryModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Название категории"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Название иконки (например: cart-outline)"
                  value={newCategoryIcon}
                  onChangeText={setNewCategoryIcon}
                />

                <TouchableOpacity style={styles.addButton} onPress={handleCreateCategory}>
                  <Text style={styles.addButtonText}>Создать категорию</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    color: '#000',
  },
  selectedTypeText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  dateButtonText: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  walletList: {
    marginBottom: 20,
  },
  walletItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    minWidth: 120,
  },
  selectedWallet: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  walletName: {
    fontSize: 16,
    marginBottom: 5,
  },
  walletBalance: {
    color: '#666',
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    minWidth: 80,
  },
  selectedCategory: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  categoryName: {
    marginTop: 5,
    fontSize: 12,
  },
  addCategoryButton: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 10,
    minWidth: 120,
  },
  addCategoryText: {
    marginTop: 5,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 