import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { processReceipt } from './services/visionService';

export default function ReceiptScanner() {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    try {
      // Запрашиваем разрешение на доступ к галерее
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение для доступа к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
        // ВАЖНО: Принудительно конвертируем в JPEG для совместимости
        allowsMultipleSelection: false,
        exif: false,
        // На iOS принудительно сохраняем как JPEG
        ...(Platform.OS === 'ios' && {
          videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
        }),
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Ошибка при выборе изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  const takePhoto = async () => {
    try {
      // Запрашиваем разрешение на доступ к камере
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение для доступа к камере');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Ошибка при фотографировании:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      console.log('Начинаем обработку изображения:', capturedImage);
      const receiptData = await processReceipt(capturedImage);
      
      console.log('Данные чека:', receiptData);
      
      // Проверяем, что получили корректные данные
      if (receiptData.amount === 0 && receiptData.description === 'Ошибка сканирования') {
        Alert.alert(
          'Ошибка сканирования', 
          'Не удалось обработать чек. Попробуйте другое изображение или введите данные вручную.',
          [
            { text: 'OK', onPress: () => setCapturedImage(null) }
          ]
        );
        return;
      }
      
      // Навигация обратно с данными
      router.push({
        pathname: '/add-transaction',
        params: {
          amount: receiptData.amount.toString(),
          description: receiptData.description,
          category: receiptData.category,
          date: receiptData.date.toISOString(),
          merchantName: receiptData.merchantName,
          type: 'EXPENSE',
        },
      });
    } catch (error) {
      console.error('Ошибка обработки изображения:', error);
      Alert.alert(
        'Ошибка обработки', 
        'Произошла ошибка при обработке чека. Попробуйте снова.',
        [
          { text: 'OK', onPress: () => setCapturedImage(null) }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.retakeButton]}
            onPress={() => setCapturedImage(null)}
            disabled={isProcessing}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.buttonText}>Выбрать другое</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.processButton, isProcessing && styles.disabledButton]}
            onPress={processImage}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Обработка...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="white" />
                <Text style={styles.buttonText}>Обработать</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Сканирование чека</Text>
          <Text style={styles.subtitle}>Сфотографируйте чек или выберите изображение из галереи</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={32} color="white" />
              <Text style={styles.actionButtonText}>Сфотографировать</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickImage}
            >
              <Ionicons name="images" size={32} color="white" />
              <Text style={styles.actionButtonText}>Из галереи</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  closeButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    minWidth: 140,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    justifyContent: 'center',
  },
  pickButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 120,
    justifyContent: 'center',
  },
  retakeButton: {
    backgroundColor: '#FF3B30',
  },
  processButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});