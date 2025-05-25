import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = 'http://localhost:8080/api';

interface AddTransactionSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ManualTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({ 
  visible, 
  onClose, 
  onSuccess 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/transactions`, {
        type,
        amount: parseFloat(amount),
        description,
        category: category || 'Other',
        date: new Date().toISOString(),
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setType('EXPENSE');
      
      onSuccess();
      onClose();
      Alert.alert('Success', 'Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setAmount('');
    setDescription('');
    setCategory('');
    setType('EXPENSE');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Transaction Manually</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'EXPENSE' && styles.activeTypeButton]}
              onPress={() => setType('EXPENSE')}
            >
              <Text style={[styles.typeButtonText, type === 'EXPENSE' && styles.activeTypeButtonText]}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === 'INCOME' && styles.activeTypeButton]}
              onPress={() => setType('INCOME')}
            >
              <Text style={[styles.typeButtonText, type === 'INCOME' && styles.activeTypeButtonText]}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Amount *"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Description *"
            value={description}
            onChangeText={setDescription}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Category (optional)"
            value={category}
            onChangeText={setCategory}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {loading ? 'Adding...' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AddTransactionSelectionModal: React.FC<AddTransactionSelectionModalProps> = ({ 
  visible, 
  onClose, 
  onSuccess 
}) => {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleOptionSelect = (option: string) => {
    switch (option) {
      case 'manual':
        setShowManualModal(true);
        break;
      case 'voice':
        Alert.alert('Coming Soon', 'Voice recording feature will be available in the next update!');
        break;
      case 'scan':
        Alert.alert('Coming Soon', 'Photo scanning feature will be available in the next update!');
        break;
    }
  };

  const handleManualModalClose = () => {
    setShowManualModal(false);
    onClose();
  };

  const handleManualModalSuccess = () => {
    setShowManualModal(false);
    onSuccess();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.subtitle}>Choose how you want to add your transaction:</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={() => handleOptionSelect('manual')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="create-outline" size={32} color="#5E35B1" />
                </View>
                <Text style={styles.optionTitle}>Manual Entry</Text>
                <Text style={styles.optionDescription}>
                  Enter transaction details manually
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionCard, styles.disabledCard]}
                onPress={() => handleOptionSelect('voice')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="mic-outline" size={32} color="#9E9E9E" />
                </View>
                <Text style={[styles.optionTitle, styles.disabledText]}>Voice Recording</Text>
                <Text style={[styles.optionDescription, styles.disabledText]}>
                  Record transaction with voice (Coming Soon)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionCard, styles.disabledCard]}
                onPress={() => handleOptionSelect('scan')}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="camera-outline" size={32} color="#9E9E9E" />
                </View>
                <Text style={[styles.optionTitle, styles.disabledText]}>Scan Receipt</Text>
                <Text style={[styles.optionDescription, styles.disabledText]}>
                  Take photo of receipt (Coming Soon)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ManualTransactionModal
        visible={showManualModal}
        onClose={handleManualModalClose}
        onSuccess={handleManualModalSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  selectionModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectionModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  disabledCard: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  disabledText: {
    color: '#9E9E9E',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTypeButton: {
    backgroundColor: '#5E35B1',
    borderColor: '#5E35B1',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#5E35B1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
});

export default AddTransactionSelectionModal;