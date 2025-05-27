import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VoiceRecognitionModalProps {
  visible: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

const VoiceRecognitionModal: React.FC<VoiceRecognitionModalProps> = ({
  visible,
  onClose,
  onResult,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [visible]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecognizedText('');
      
      // Start listening for speech
      await Speech.startListeningAsync({
        onResult: (result) => {
          setRecognizedText(result.value);
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
          setIsRecording(false);
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      await Speech.stopListeningAsync();
      setIsRecording(false);
      if (recognizedText) {
        onResult(recognizedText);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.recordingContainer}>
            {isRecording ? (
              <>
                <View style={styles.recordingIndicator}>
                  <ActivityIndicator size="large" color="#1CC6DD" />
                </View>
                <Text style={styles.recordingText}>Listening...</Text>
              </>
            ) : (
              <Text style={styles.recordingText}>Tap to start recording</Text>
            )}
          </View>

          {recognizedText ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{recognizedText}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={32}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1,
  },
  recordingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  recordingIndicator: {
    marginBottom: 20,
  },
  recordingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1CC6DD',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
});

export default VoiceRecognitionModal; 