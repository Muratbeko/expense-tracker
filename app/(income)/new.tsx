import Button from '@/components/Button';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiClient } from '../../api';
import { API_CONFIG } from '../../constants';

// Category interface
interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
}

const NewIncome = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch income categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<Category[]>(`${API_CONFIG.ENDPOINTS.CATEGORIES}/income`);
      if (response.data.length > 0) {
        setCategories(response.data);
        // Set default selected category if categories exist
        setSelectedCategory(response.data[0]);
      } else {
        Alert.alert('Error', 'No income categories found');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Network error while fetching categories');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setLoading(true);

    try {
      const transaction = {
        amount: parseFloat(amount),
        date: format(date, 'yyyy-MM-dd'),
        note,
        category: { id: selectedCategory.id },
        type: 'INCOME',
        walletId: 1 // Changed from string to number type
      };

      const response = await apiClient.post(API_CONFIG.ENDPOINTS.TRANSACTIONS, transaction);

      Alert.alert('Success', 'Income added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error adding income:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Typo size={24} fontWeight="700">Add Income</Typo>
          </View>
          
          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Typo size={16} fontWeight="600" style={styles.label}>Amount</Typo>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.gray}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <Typo size={16} fontWeight="600" style={styles.label}>Category</Typo>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory?.id === category.id && styles.selectedCategory,
                    { backgroundColor: selectedCategory?.id === category.id ? category.color : colors.lightGray }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Typo 
                    size={14} 
                    fontWeight="600" 
                    color={selectedCategory?.id === category.id ? colors.white : colors.black}
                  >
                    {category.name}
                  </Typo>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Date Picker */}
          <View style={styles.inputContainer}>
            <Typo size={16} fontWeight="600" style={styles.label}>Date</Typo>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Typo size={16}>{format(date, 'MMMM dd, yyyy')}</Typo>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
            {showDatePicker && Platform.OS === 'ios' && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Typo>Cancel</Typo>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Typo>Done</Typo>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  </View>
                </View>
              </Modal>
            )}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Note Input */}
          <View style={styles.inputContainer}>
            <Typo size={16} fontWeight="600" style={styles.label}>Note (Optional)</Typo>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.gray}
            />
          </View>

          {/* Submit Button */}
          <Button
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            <Typo color={colors.white} fontWeight="600" size={18}>Save Income</Typo>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default NewIncome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: colors.lightGray,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
  },
  submitButton: {
    marginTop: 30,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});