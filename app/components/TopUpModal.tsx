import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Для iOS/Android используем Picker из @react-native-picker/picker
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '../config/api';

export default function TopUpModal({ visible, onClose, goal, onSuccess }) {
  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) fetchWallets();
  }, [visible]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/wallets`);
      setWallets(res.data);
      if (res.data.length > 0) setWalletId(res.data[0].id);
    } catch (e) {
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!walletId || !amount) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/transactions`, {
        amount: parseFloat(amount),
        description: description || `Top up for ${goal.name}`,
        date,
        walletId,
        goalId: goal.id,
        type: "TRANSFER",
        comment
      });
      setAmount('');
      setDescription('');
      setComment('');
      onSuccess();
    } catch (e) {
      // Можно добавить обработку ошибок
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Top up goal</Text>
          {loading && <ActivityIndicator size="small" color="#5E35B1" />}
          <Text style={styles.label}>Wallet</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={walletId}
              onValueChange={setWalletId}
              style={styles.picker}
            >
              {wallets.map(w => (
                <Picker.Item key={w.id} label={w.name} value={w.id} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
            placeholder="Enter amount"
          />
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            placeholder="Enter name"
          />
          <Text style={styles.label}>Date</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            style={styles.input}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.label}>Comment</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            style={styles.input}
            placeholder="Enter comment"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%'
  },
  title: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 12
  },
  label: {
    marginTop: 8, marginBottom: 4, fontWeight: '500'
  },
  input: {
    borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 4
  },
  pickerWrapper: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8
  },
  picker: {
    width: '100%'
  },
  buttonRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 16
  },
  button: {
    padding: 10, borderRadius: 8, backgroundColor: '#eee', minWidth: 100, alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#5E35B1'
  },
  buttonText: {
    fontWeight: 'bold'
  }
});
