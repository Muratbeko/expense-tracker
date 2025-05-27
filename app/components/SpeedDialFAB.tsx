import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../config/api'; // updated to use apiClient
import { GOOGLE_CONFIG } from '../config/constants';
import VoiceRecognitionModal from './VoiceRecognitionModal';

interface SpeedDialFABProps {
  onMic: () => void;
  onPhoto: () => void;
  onManual: () => void;
}

interface Transaction {
  amount: number;
  currency: string;
  category: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

const askGemini = async (text: string): Promise<Transaction> => {
  const prompt = `
Extract transaction details from: "${text}".
Return JSON with fields: amount, currency, category, description, type (INCOME or EXPENSE), date (ISO).
Example: {"amount":14,"currency":"USD","category":"Groceries","description":"Grocery shopping","type":"EXPENSE","date":"2024-06-07"}
`;

  const response = await apiClient.post<GeminiResponse>(
    `${GOOGLE_CONFIG.GEMINI_API_URL}?key=${GOOGLE_CONFIG.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }]
    }
  );
  // Парсим JSON из ответа Gemini
  const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = textResponse.match(/\{.*\}/s);
  if (match) {
    return JSON.parse(match[0]) as Transaction;
  }
  throw new Error('Could not parse Gemini response');
};

const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({ onMic, onPhoto, onManual }) => {
  const [open, setOpen] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const [recognizedText, setRecognizedText] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const router = useRouter();

  const toggle = () => {
    setOpen(!open);
    setShowOptionsModal(true);
    Animated.spring(animation, {
      toValue: open ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const handleOptionSelect = (option: 'voice' | 'photo' | 'manual') => {
    setShowOptionsModal(false);
    switch (option) {
      case 'voice':
        setShowVoiceModal(true);
        break;
      case 'photo':
        onPhoto();
        break;
      case 'manual':
        onManual();
        break;
    }
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
      Alert.alert(
        'Transaction Details',
        `Amount: ${aiResult.amount} ${aiResult.currency}\nCategory: ${aiResult.category}\nDescription: ${aiResult.description}\nType: ${aiResult.type}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: handleConfirm,
          },
        ]
      );
    } catch (e) {
      Alert.alert('AI error', 'Could not parse transaction from your speech');
    }
  };

  const handleConfirm = async () => {
    if (!transaction) return;
    try {
      const newTransaction = {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category || 'Other',
        date: transaction.date || new Date().toISOString(),
        walletId: 1,
        currency: transaction.currency || 'RUB'
      };

      console.log('Отправляем транзакцию:', JSON.stringify(newTransaction, null, 2));
      const result = await apiClient.post('/transactions', newTransaction);
      console.log('Ответ сервера:', JSON.stringify(result, null, 2));
      
      // Сбрасываем состояние
      setTransaction(null);
      setRecognizedText('');
      setShowVoiceModal(false);
      
      // Показываем уведомление об успехе
      Alert.alert(
        'Успех',
        'Транзакция успешно добавлена',
        [
          {
            text: 'OK',
            onPress: () => {
              // Переходим на главную страницу вкладок
              router.replace('/(tabs)/index');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Ошибка при сохранении транзакции:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить транзакцию. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {/* Voice Recognition Modal */}
      <VoiceRecognitionModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onResult={handleMicResult}
      />

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleOptionSelect('voice')}
            >
              <Ionicons name="mic" size={24} color="#1CC6DD" />
              <Text style={styles.optionText}>Голосовой ввод</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleOptionSelect('photo')}
            >
              <Ionicons name="camera" size={24} color="#1CC6DD" />
              <Text style={styles.optionText}>Сканировать чек</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleOptionSelect('manual')}
            >
              <MaterialIcons name="edit" size={24} color="#1CC6DD" />
              <Text style={styles.optionText}>Ввести вручную</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Микрофон */}
      <Animated.View style={[styles.action, micStyle]} pointerEvents={open ? 'auto' : 'none'}>
        <TouchableOpacity 
          onPress={() => { 
            setOpen(false); 
            setShowVoiceModal(true);
          }} 
          style={styles.circle} 
          activeOpacity={0.8}
        >
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
      {/* Main FAB Button */}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});

export default SpeedDialFAB; 