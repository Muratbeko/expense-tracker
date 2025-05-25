import apiService from '@/services/api'; // ваш сервис для работы с транзакциями
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SpeedDialFABProps {
  onMic: () => void;
  onPhoto: () => void;
  onManual: () => void;
}

const GEMINI_API_KEY = 'AIzaSyAaWQqV5XTUPLXCtFpHoBA4ZkbdSLgHe_E';

const askGemini = async (text: string) => {
  const prompt = `
Extract transaction details from: "${text}".
Return JSON with fields: amount, currency, category, description, type (INCOME or EXPENSE), date (ISO).
Example: {"amount":14,"currency":"USD","category":"Groceries","description":"Grocery shopping","type":"EXPENSE","date":"2024-06-07"}
`;

  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY,
    {
      contents: [{ parts: [{ text: prompt }] }]
    }
  );
  // Парсим JSON из ответа Gemini
  const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = textResponse.match(/\{.*\}/s);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error('Could not parse Gemini response');
};

const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({ onMic, onPhoto, onManual }) => {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const [recognizedText, setRecognizedText] = useState('');
  const [transaction, setTransaction] = useState(null);

  const toggle = () => {
    setOpen(!open);
    Animated.spring(animation, {
      toValue: open ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  // Позиции для кружков (по дуге)
  const micStyle = {
    transform: [ 
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) },
      { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
      { scale: animation },
    ],
    opacity: animation,
  };
  const photoStyle = {
    transform: [
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -110] }) },
      { scale: animation },
    ],
    opacity: animation,
  };
  const manualStyle = {
    transform: [
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) },
      { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
      { scale: animation },
    ],
    opacity: animation,
  };

  const handleMicResult = async (text: string) => {
    setRecognizedText(text);
    try {
      const aiResult = await askGemini(text);
      setTransaction(aiResult);
    } catch (e) {
      Alert.alert('AI error', 'Could not parse transaction from your speech');
    }
  };

  const handleConfirm = async () => {
    if (!transaction) return;
    try {
      await apiService.createTransaction({
        type: transaction.type || 'EXPENSE',
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date || new Date().toISOString(),
        walletId: '1', // или ваш текущий кошелёк
      });
      Alert.alert('Success', 'Transaction added!');
      // Навигация назад или обновление списка
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {/* Микрофон */}
      <Animated.View style={[styles.action, micStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <TouchableOpacity onPress={() => { setOpen(false); onMic(); }} style={styles.circle} activeOpacity={0.8}>
          <Ionicons name="mic" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
      {/* Фото */}
      <Animated.View style={[styles.action, photoStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <TouchableOpacity onPress={() => { setOpen(false); onPhoto(); }} style={styles.circle} activeOpacity={0.8}>
          <Ionicons name="camera" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
      {/* Ввод вручную */}
      <Animated.View style={[styles.action, manualStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <TouchableOpacity onPress={() => { setOpen(false); onManual(); }} style={styles.circle} activeOpacity={0.8}>
          <MaterialIcons name="edit" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
      {/* Кнопка плюс */}
      <TouchableOpacity onPress={toggle} style={styles.mainButton} activeOpacity={0.85}>
        <Ionicons name={open ? 'close' : 'add'} size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1CC6DD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  action: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1CC6DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
});

export default SpeedDialFAB; 