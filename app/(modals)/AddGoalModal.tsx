import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface SavingGoal {
  id?: number;
  name: string;
  description?: string;
  currentAmount: number;
  targetAmount: number;
  targetDate?: string;
  imageUrl?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<SavingGoal>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    category: '',
    imageUrl: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetAmount: '',
      targetDate: '',
      priority: 'MEDIUM',
      category: '',
      imageUrl: ''
    });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.targetAmount) {
      Alert.alert('Error', 'Please fill in goal name and target amount');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    const goalData: Partial<SavingGoal> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      targetAmount,
      targetDate: formData.targetDate || undefined,
      priority: formData.priority,
      category: formData.category.trim() || 'General',
      imageUrl: formData.imageUrl || undefined,
      currentAmount: 0
    };

    onSave(goalData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, imageUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Saving Goal</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.content}>
          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
            <Ionicons name="camera" size={24} color="#5E35B1" />
            <Text style={styles.imagePickerText}>
              {formData.imageUrl ? 'Change Motivational Image' : 'Add Motivational Image'}
            </Text>
          </TouchableOpacity>

          {/* Goal Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="e.g., New Car, Vacation, Emergency Fund"
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your goal and what motivates you"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Target Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.targetAmount}
              onChangeText={(text) => {
                // Only allow numbers and decimal point
                const cleaned = text.replace(/[^0-9.]/g, '');
                // Prevent multiple decimal points
                const parts = cleaned.split('.');
                if (parts.length > 2) {
                  return;
                }
                setFormData({ ...formData, targetAmount: cleaned });
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Target Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Date (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.targetDate}
              onChangeText={(text) => setFormData({ ...formData, targetDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.textInput}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              placeholder="e.g., Travel, Car, House, Emergency"
              maxLength={50}
            />
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    formData.priority === priority && styles.priorityOptionSelected,
                    { borderColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => setFormData({ ...formData, priority })}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      formData.priority === priority && { 
                        color: getPriorityColor(priority),
                        fontWeight: '600' 
                      }
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        paddingTop: 60,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  cancelButton: {
    fontSize: 16,
    color: '#757575',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  saveButton: {
    backgroundColor: '#5E35B1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#5E35B1',
    marginLeft: 8,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  priorityOptionSelected: {
    backgroundColor: '#F8F8FC',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  bottomPadding: {
    height: 20,
  },
});