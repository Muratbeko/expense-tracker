// components/EditBudgetModal.tsx
import type { Budget } from '@/types';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface EditBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBudgetTotal: number) => Promise<void>;
  budget: Budget | null;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  visible,
  onClose,
  onSuccess,
  budget
}) => {
  const [newTotal, setNewTotal] = useState(budget?.total.toString() || '');

  const handleSave = async () => {
    const total = parseFloat(newTotal);
    if (isNaN(total) || total <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    await onSuccess(total);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Budget</Text>
          <TextInput
            style={styles.input}
            value={newTotal}
            onChangeText={setNewTotal}
            keyboardType="numeric"
            placeholder="Enter new budget amount"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#212121',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#5E35B1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  saveButtonText: {
    color: 'white',
  },
});

export default EditBudgetModal;