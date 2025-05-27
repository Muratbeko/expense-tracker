import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../config/api';
import { GOOGLE_CONFIG } from '../config/constants';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface TransactionData {
  amount: number;
  currency: string;
  category: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

const askGemini = async (text: string): Promise<TransactionData> => {
  const prompt = `Extract transaction details from: "${text}".\nReturn JSON with fields: amount, currency, category, description, type (INCOME or EXPENSE), date (ISO).\nExample: {"amount":14,"currency":"USD","category":"Groceries","description":"Grocery shopping","type":"EXPENSE","date":"2024-06-07"}`;
  const response = await apiClient.post<GeminiResponse>(
    `${GOOGLE_CONFIG.GEMINI_API_URL}?key=${GOOGLE_CONFIG.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }]
    }
  );
  const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = textResponse.match(/\{.*\}/s);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error('Could not parse Gemini response');
};

const recognizeSpeechFromAudio = async (uri: string): Promise<string> => {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const body = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    },
    audio: {
      content: base64,
    },
  };
  
  interface SpeechResponse {
    results?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  }
  
  const response = await apiClient.post<SpeechResponse>(
    `${GOOGLE_CONFIG.SPEECH_API_URL}?key=${GOOGLE_CONFIG.SPEECH_API_KEY}`,
    body,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const data = response.data;
  const alternatives = data.results?.[0]?.alternatives;
  if (alternatives && alternatives[0]?.transcript) {
    return alternatives[0].transcript;
  }
  throw new Error('Speech recognition failed or no speech detected');
};

export default function VoiceTransactionScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'recognizing' | 'ai' | 'ready' | 'saving'>('idle');
  const router = useRouter();
  const audioUri = useRef<string | null>(null);

  const startRecording = async () => {
    setAiError(null);
    setRecognizedText('');
    setTransaction(null);
    setStatus('recording');
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setStatus('idle');
        setAiError('Microphone permission not granted');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      setStatus('idle');
      setAiError('Could not start recording');
    }
  };

  const stopRecording = async () => {
    setStatus('recognizing');
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        audioUri.current = uri;
        // Convert to LINEAR16 WAV for Google API (expo-av записывает в m4a/aac по умолчанию)
        // Для простоты попробуем отправить m4a, Google иногда принимает, но лучше конвертировать на сервере
        setLoading(true);
        try {
          const transcript = await recognizeSpeechFromAudio(uri);
          setRecognizedText(transcript);
          setStatus('ai');
          try {
            const aiResult = await askGemini(transcript);
            setTransaction(aiResult);
            setStatus('ready');
          } catch (e) {
            setAiError('AI could not parse transaction from your speech');
            setStatus('idle');
          }
        } catch (e) {
          setAiError('Speech recognition failed');
          setStatus('idle');
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      setAiError('Could not stop recording');
      setStatus('idle');
    }
  };

  const handleConfirm = async () => {
    if (!transaction) return;
    setSaving(true);
    setStatus('saving');
    try {
      await apiClient.post('/transactions', {
        type: transaction.type || 'EXPENSE',
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date || new Date().toISOString(),
        walletId: 1, // Changed from string to number to fix type error
      });
      Alert.alert('Success', 'Transaction added!');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSaving(false);
      setStatus('idle');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#1CC6DD" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {status === 'idle' && !transaction && !aiError && (
            <>
              <Text style={styles.instructionTitle}>
                Hold the button and say how much you <Text style={styles.bold}>spent</Text> or <Text style={styles.bold}>earned</Text> and <Text style={styles.bold}>where</Text>
              </Text>
              <Text style={styles.instructionSub}>Ex.: I spent 14 dollars at the grocery</Text>
              {recognizedText ? (
                <Text style={{ color: '#5E35B1', marginTop: 16, textAlign: 'center' }}>{recognizedText}</Text>
              ) : null}
            </>
          )}
          {status === 'recording' && (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator size="large" color="#5E35B1" />
              <Text style={{ color: '#5E35B1', marginTop: 12 }}>Recording...</Text>
            </View>
          )}
          {status === 'recognizing' && (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator size="large" color="#5E35B1" />
              <Text style={{ color: '#5E35B1', marginTop: 12 }}>Recognizing speech...</Text>
            </View>
          )}
          {status === 'ai' && (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator size="large" color="#5E35B1" />
              <Text style={{ color: '#5E35B1', marginTop: 12 }}>Analyzing your speech...</Text>
            </View>
          )}
          {aiError && (
            <Text style={{ color: '#F44336', marginTop: 24, textAlign: 'center' }}>{aiError}</Text>
          )}
          {transaction && status === 'ready' && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="restaurant" size={20} color="#5E35B1" style={{ marginRight: 8 }} />
                <Text style={styles.resultCategory}>{transaction.category}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.resultDate}>{transaction.date ? new Date(transaction.date).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={styles.resultDescription}>{transaction.description}</Text>
              <Text style={styles.resultAmount}>{transaction.amount < 0 ? '-' : '+'}{transaction.currency || ''}{Math.abs(transaction.amount).toFixed(2)}</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => { setTransaction(null); setStatus('idle'); }}>
                  <MaterialIcons name="edit" size={18} color="#5E35B1" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Mic Button */}
        <View style={styles.micContainer}>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.8}
            disabled={loading || saving || isRecording || status === 'recognizing' || status === 'ai'}
          >
            <Ionicons name="mic" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1CC6DD',
    flex: 1,
    textAlign: 'center',
    marginRight: 36,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  instructionTitle: {
    fontSize: 18,
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#5E35B1',
  },
  instructionSub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5E35B1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#5E35B1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  micBtnActive: {
    backgroundColor: '#7C4DFF',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'flex-start',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  resultCategory: {
    fontWeight: 'bold',
    color: '#5E35B1',
    fontSize: 14,
  },
  resultDate: {
    color: '#888',
    fontSize: 13,
  },
  resultDescription: {
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
    marginTop: 4,
  },
  resultAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 12,
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  editBtn: {
    backgroundColor: '#F3EFFF',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  confirmBtn: {
    backgroundColor: '#5E35B1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 