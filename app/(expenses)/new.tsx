import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiClient } from '../../api';
import { API_CONFIG } from '../../constants';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

const NewExpense = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<Category[]>(`${API_CONFIG.ENDPOINTS.CATEGORIES}/expense`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAmountInput = (digit: string) => {
    if (digit === '.' && amount.includes('.')) {
      return; // Prevent multiple decimal points
    }

    if (amount === '0' && digit !== '.') {
      setAmount(digit);
    } else {
      setAmount(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setShowCategories(false);
    setShowKeypad(true);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(API_CONFIG.ENDPOINTS.TRANSACTIONS, {
        amount: parseFloat(amount),
        categoryId: selectedCategory.id,
        type: 'EXPENSE',
        date: date.toISOString().split('T')[0],
        note: note,
        walletId: 1
      });

      Alert.alert('Success', 'Expense saved successfully');
      router.back();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = () => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const day = days[date.getDay()];
    return `${day}, ${date.getDate()} ${getMonthName(date.getMonth())}`;
  };

  const getMonthName = (month: number) => {
    const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 
                   'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
    return months[month];
  };

  // Function to get icon for category
  const getCategoryIcon = (iconName: string) => {
    const iconSize = 24;
    
    switch (iconName) {
      case 'food':
        return <Ionicons name="cart" size={iconSize} color={colors.white} />;
      case 'transport':
        return <Ionicons name="bus" size={iconSize} color={colors.white} />;
      case 'home':
        return <Ionicons name="home" size={iconSize} color={colors.white} />;
      case 'entertainment':
        return <Ionicons name="tv" size={iconSize} color={colors.white} />;
      case 'shopping':
        return <Ionicons name="bag" size={iconSize} color={colors.white} />;
      case 'health':
        return <Ionicons name="medical" size={iconSize} color={colors.white} />;
      case 'pets':
        return <MaterialCommunityIcons name="paw" size={iconSize} color={colors.white} />;
      case 'car':
        return <Ionicons name="car" size={iconSize} color={colors.white} />;
      case 'gifts':
        return <Ionicons name="gift" size={iconSize} color={colors.white} />;
      case 'sports':
        return <Ionicons name="football" size={iconSize} color={colors.white} />;
      case 'restaurant': 
        return <Ionicons name="restaurant" size={iconSize} color={colors.white} />;
      case 'bills':
        return <Ionicons name="document-text" size={iconSize} color={colors.white} />;
      case 'clothing':
        return <Ionicons name="shirt" size={iconSize} color={colors.white} />;
      case 'education':
        return <Ionicons name="school" size={iconSize} color={colors.white} />;
      case 'phone':
        return <Ionicons name="call" size={iconSize} color={colors.white} />;
      case 'taxi':
        return <Ionicons name="car" size={iconSize} color={colors.white} />;
      default:
        return <Ionicons name="cash" size={iconSize} color={colors.white} />;
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Typo size={16} fontWeight="500" color={colors.white}>Отменить</Typo>
          </TouchableOpacity>
          <Typo size={18} fontWeight="600" color={colors.white}>Новый расход</Typo>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="refresh" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Date Display */}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={24} color={colors.neutral500} />
          <Typo size={16} color={colors.neutral700} style={styles.dateText}>
            {formatDateForDisplay()}
          </Typo>
        </View>

        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <View style={styles.currencyContainer}>
            <Ionicons name="cash" size={24} color={colors.primary} />
            <Typo size={16} color={colors.neutral700}>KGS</Typo>
          </View>
          <View style={styles.amountInputContainer}>
            <Typo size={32} fontWeight="700" color={colors.neutral800}>
              {amount || '0'}
            </Typo>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="close" size={18} color={colors.neutral500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Input */}
        <View style={styles.noteContainer}>
          <Ionicons name="document-text" size={20} color={colors.neutral500} />
          <TextInput
            style={styles.noteInput}
            placeholder="Добавить заметку"
            placeholderTextColor={colors.neutral500}
            value={note}
            onChangeText={setNote}
          />
        </View>

        {showKeypad ? (
          <>
            {/* Numeric Keypad */}
            <View style={styles.keypadContainer}>
              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('1')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>1</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('2')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>2</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('3')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>3</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => {}}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>+</Typo>
                </TouchableOpacity>
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('4')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>4</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('5')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>5</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('6')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>6</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => {}}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>-</Typo>
                </TouchableOpacity>
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('7')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>7</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('8')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>8</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('9')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>9</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => {}}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>*</Typo>
                </TouchableOpacity>
              </View>
              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('.')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>.</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => handleAmountInput('0')}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>0</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => {}}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>=</Typo>
                </TouchableOpacity>
                <TouchableOpacity style={styles.keypadButton} onPress={() => {}}>
                  <Typo size={24} fontWeight="600" color={colors.neutral800}>/</Typo>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => {
                setShowKeypad(false);
                setShowCategories(true);
              }}
            >
              <Typo size={16} fontWeight="600" color={colors.white}>
                ВЫБОР КАТЕГОРИИ
              </Typo>
            </TouchableOpacity>
          </>
        ) : null}

        {showCategories ? (
          <>
            <ScrollView contentContainerStyle={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity 
                  key={category.id} 
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(category)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    {getCategoryIcon(category.icon)}
                  </View>
                  <Typo size={14} color={colors.neutral800} style={styles.categoryName}>
                    {category.name}
                  </Typo>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.categoryButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading || !selectedCategory || !amount}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Typo size={16} fontWeight="600" color={colors.white}>
                  ДОБАВИТЬ
                </Typo>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {selectedCategory && (
          <View style={styles.selectedCategoryBar}>
            <View style={[styles.categoryIndicator, { backgroundColor: selectedCategory.color }]}>
              {getCategoryIcon(selectedCategory.icon)}
            </View>
            <Typo size={16} color={colors.neutral800} fontWeight="500">
              {selectedCategory.name}
            </Typo>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default NewExpense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  dateText: {
    marginLeft: spacingX._10,
  },
  amountContainer: {
    paddingVertical: spacingY._20,
    paddingHorizontal: spacingX._20,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    padding: spacingX._10,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  noteInput: {
    flex: 1,
    marginLeft: spacingX._10,
    color: colors.neutral800,
    fontSize: 16,
  },
  keypadContainer: {
    flex: 1,
    padding: spacingX._10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacingY._10,
  },
  keypadButton: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius._3,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  categoryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacingX._20,
    marginBottom: spacingY._20,
    borderRadius: radius._3,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacingX._10,
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    marginVertical: spacingY._10,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._5,
  },
  categoryName: {
    textAlign: 'center',
  },
  selectedCategoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    backgroundColor: colors.neutral50,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  categoryIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._10,
  }
});