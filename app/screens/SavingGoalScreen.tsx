import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_CONFIG } from '../config/constants';
import apiService from '../services/api';
import type { SavingGoal } from '../types';

interface FormData {
  name: string;
  description: string;
  targetAmount: string;
  targetDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  imageUrl: string;
}

const SavingGoalScreen: React.FC = () => {
  const router = useRouter();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});
  
  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    priority: 'MEDIUM',
    category: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async (): Promise<void> => {
    try {
      setLoading(true);
      const goals = await apiService.getGoals();
      console.log('Fetched goals:', goals);
      setGoals(goals);
      
      // Log each goal with image for debugging
      goals.forEach((goal: SavingGoal) => {
        if (goal.imageUrl) {
          console.log(`Goal "${goal.name}" has image URL: ${goal.imageUrl}`);
        }
      });
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load saving goals');
    } finally {
      setLoading(false);
    }
  };

  // Improved function for image selection
  const handleImagePicker = async (): Promise<void> => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false, // Don't use base64 to save memory
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        setFormData({ ...formData, imageUrl: imageUri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const resetForm = (): void => {
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

  // Improved function for creating goal
  const handleAddGoal = async (): Promise<void> => {
    if (!formData.name || !formData.targetAmount) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      console.log('Creating goal with image:', formData.imageUrl);

      // If there's a local image, upload it first
      let finalImageUrl: string | null = null;
      if (formData.imageUrl && !formData.imageUrl.startsWith('http')) {
        finalImageUrl = await uploadImageFirst(formData.imageUrl);
      } else if (formData.imageUrl && formData.imageUrl.startsWith('http')) {
        finalImageUrl = formData.imageUrl;
      }

      const goalData: Omit<SavingGoal, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: 0,
        targetDate: formData.targetDate || undefined,
        priority: formData.priority,
        category: formData.category?.trim() || '',
        imageUrl: finalImageUrl || undefined
      };

      console.log('Sending goal data:', goalData);

      const createdGoal = await apiService.createGoal(goalData);
      console.log('Goal created successfully:', createdGoal);
      Alert.alert('Success', 'Goal created successfully!');
      setIsAddModalVisible(false);
      resetForm();
      fetchGoals();
    } catch (error: unknown) {
      console.error('Error creating goal:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to create goal: ${errorMessage}`);
    }
  };

  // Function for uploading image first
  const uploadImageFirst = async (imageUri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      
      // Get file information
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);

      console.log('Uploading image:', { uri: imageUri, type, name: filename });

      const result = await apiService.uploadImage(formData, '/images/upload');
      console.log('Image uploaded successfully:', result);
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Return null but don't stop goal creation
      return null;
    }
  };

  // Function for adding money
  const handleAddMoney = (goal: SavingGoal): void => {
    Alert.prompt(
      'Add Money',
      `Add money to "${goal.name}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (value?: string) => {
            if (value && !isNaN(parseFloat(value))) {
              const amount = parseFloat(value);
              try {
                // Update the goal's current amount
                const updatedAmount = goal.currentAmount + amount;
                await apiService.updateGoal(goal.id!.toString(), {
                  ...goal,
                  currentAmount: updatedAmount
                });
                Alert.alert('Success', 'Money added successfully!');
                fetchGoals();
              } catch (error) {
                console.error('Error adding money:', error);
                Alert.alert('Error', 'Failed to add money');
              }
            } else {
              Alert.alert('Error', 'Please enter a valid amount');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleEditGoal = async (): Promise<void> => {
    if (!selectedGoal || !formData.name || !formData.targetAmount) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      let finalImageUrl = formData.imageUrl;
      
      // If a new local image is selected
      if (formData.imageUrl && !formData.imageUrl.startsWith('http') && formData.imageUrl !== selectedGoal.imageUrl) {
        finalImageUrl = await uploadImageFirst(formData.imageUrl) || formData.imageUrl;
      }

      const goalData: Partial<SavingGoal> = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: selectedGoal.currentAmount,
        targetDate: formData.targetDate || undefined,
        priority: formData.priority,
        category: formData.category?.trim() || '',
        imageUrl: finalImageUrl || undefined
      };

      await apiService.updateGoal(selectedGoal.id!.toString(), goalData);
      Alert.alert('Success', 'Goal updated successfully!');
      setIsEditModalVisible(false);
      setSelectedGoal(null);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const handleDeleteGoal = (goal: SavingGoal): void => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteGoal(goal.id!.toString());
              Alert.alert('Success', 'Goal deleted successfully!');
              fetchGoals();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (goal: SavingGoal): void => {
    setSelectedGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate || '',
      priority: goal.priority,
      category: goal.category,
      imageUrl: goal.imageUrl || ''
    });
    setIsEditModalVisible(true);
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const calculateProgress = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  // Fixed function to properly construct image URLs
  const getGoalImageUrl = (goal: SavingGoal): string | null => {
    if (!goal.imageUrl) return null;
    
    // If it's already a full URL, return as is
    if (goal.imageUrl.startsWith('http')) {
      return goal.imageUrl;
    }
    
    // Otherwise, construct the full URL with the API base
    return `${API_CONFIG.BASE_URL}/api/goals/images/${goal.imageUrl}`;
  };

  const getDaysLeft = (targetDate: string): number | null => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Function for handling image loading errors
  const handleImageError = (goalId: number): void => {
    console.warn(`Failed to load image for goal ${goalId}`);
    setImageErrors(prev => ({ ...prev, [goalId]: true }));
  };

  // Function for checking image URL validity
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    // Check local URIs (for React Native)
    if (url.startsWith('file://') || url.startsWith('content://')) return true;
    // Check HTTP/HTTPS URLs
    if (url.startsWith('http://') || url.startsWith('https://')) return true;
    return false;
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (goal.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || goal.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const renderGoalCard = ({ item: goal }: { item: SavingGoal }) => {
    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
    const daysLeft = getDaysLeft(goal.targetDate || '');
    const imageUrl = getGoalImageUrl(goal);
    
    return (
      <View style={styles.goalCard}>
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.goalImage}
              onError={() => handleImageError(goal.id!)}
              onLoadStart={() => console.log(`Loading image for goal ${goal.id}: ${imageUrl}`)}
              onLoadEnd={() => console.log(`Image loaded for goal ${goal.id}`)}
            />
          </View>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#BDBDBD" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        <View style={styles.goalContent}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Text style={styles.goalTitle}>{goal.name}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                <Text style={styles.priorityText}>{goal.priority}</Text>
              </View>
            </View>
            
            <View style={styles.goalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAddMoney(goal)}
              >
                <Ionicons name="add-circle" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(goal)}
              >
                <Ionicons name="pencil" size={20} color="#5E35B1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteGoal(goal)}
              >
                <Ionicons name="trash" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>

          {goal.description && (
            <Text style={styles.goalDescription}>{goal.description}</Text>
          )}

          <View style={styles.amountContainer}>
            <Text style={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</Text>
            <Text style={styles.targetAmount}>of {formatCurrency(goal.targetAmount)}</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          <View style={styles.goalMeta}>
            <Text style={styles.progressText}>{progress.toFixed(1)}% complete</Text>
            {daysLeft !== null && (
              <Text style={styles.daysLeft}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Target date reached'}
              </Text>
            )}
          </View>

          {goal.category && (
            <View style={styles.categoryContainer}>
              <Ionicons name="pricetag" size={14} color="#757575" />
              <Text style={styles.categoryText}>{goal.category}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? isEditModalVisible : isAddModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              if (isEdit) {
                setIsEditModalVisible(false);
                setSelectedGoal(null);
              } else {
                setIsAddModalVisible(false);
              }
              resetForm();
            }}
          >
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Goal' : 'New Saving Goal'}
          </Text>
          <TouchableOpacity
            onPress={isEdit ? handleEditGoal : handleAddGoal}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {formData.imageUrl && isValidImageUrl(formData.imageUrl) && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: formData.imageUrl }} 
                style={styles.imagePreview}
                onError={() => console.warn('Failed to load preview image')}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setFormData({ ...formData, imageUrl: '' })}
              >
                <Ionicons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
            <Ionicons name="camera" size={24} color="#5E35B1" />
            <Text style={styles.imagePickerText}>
              {formData.imageUrl ? 'Change Image' : 'Add Motivational Image'}
            </Text>
          </TouchableOpacity>

          {/* Rest of the form fields remain unchanged */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Goal Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="e.g., New Car, Vacation, Emergency Fund"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your goal and motivation"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Amount *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.targetAmount}
              onChangeText={(text) => setFormData({ ...formData, targetAmount: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Date</Text>
            <TextInput
              style={styles.textInput}
              value={formData.targetDate}
              onChangeText={(text) => setFormData({ ...formData, targetDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.textInput}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              placeholder="e.g., Travel, Car, House, Emergency"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
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
                      formData.priority === priority && { color: getPriorityColor(priority) }
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saving Goals</Text>
        <TouchableOpacity onPress={() => setIsAddModalVisible(true)}>
          <Ionicons name="add" size={24} color="#5E35B1" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search goals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterChip,
                filterPriority === priority && styles.filterChipActive
              ]}
              onPress={() => setFilterPriority(priority)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterPriority === priority && styles.filterChipTextActive
                ]}
              >
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredGoals}
        renderItem={renderGoalCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.goalsList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchGoals}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy" size={64} color="#E0E0E0" />
            <Text style={styles.emptyStateTitle}>No Saving Goals Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create your first saving goal and start building your future!
            </Text>
            <TouchableOpacity
              style={styles.createFirstGoalButton}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Text style={styles.createFirstGoalText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderModal(false)}
      {renderModal(true)}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212121',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#5E35B1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  goalsList: {
    padding: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 150,
  },
  goalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 4,
  },
  goalContent: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goalActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5E35B1',
    marginRight: 8,
  },
  targetAmount: {
    fontSize: 16,
    color: '#757575',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5E35B1',
    borderRadius: 4,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  daysLeft: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstGoalButton: {
    backgroundColor: '#5E35B1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstGoalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#757575',
  },
  modalTitle: {
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
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
  inputLabel: {
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
  },
  priorityOptionSelected: {
    backgroundColor: '#F5F5F5',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
});

export default SavingGoalScreen;






