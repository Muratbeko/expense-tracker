import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
}

interface AddTransactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080' 
  : 'http://192.168.0.109:8080';

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');

  const icons = [
    'cart', 'restaurant', 'car', 'home', 'airplane', 'medical', 'school',
    'gift', 'cash', 'card', 'wallet', 'pricetag', 'basket', 'cafe',
    'beer', 'wine', 'pizza', 'fast-food', 'fitness', 'game-controller'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>(`${API_BASE_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName || !selectedIcon) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post<Category>(`${API_BASE_URL}/api/categories`, {
        name: newCategoryName,
        icon: selectedIcon,
        type: type,
        color: '#5E35B1'
      });

      setCategories([...categories, response.data]);
      setCategory(response.data.id.toString());
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setSelectedIcon('');
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('amount', amount);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('date', new Date().toISOString());
      
      if (image) {
        const imageUri = image;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('receipt', {
          uri: imageUri,
          name: filename,
          type
        } as any);
      }

      await axios.post(`${API_BASE_URL}/api/transactions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setAmount('');
      setDescription('');
      setCategory('');
      setImage(null);
      onSuccess();
      onClose();
      Alert.alert('Success', 'Transaction added successfully');
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
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
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      {!showNewCategoryForm ? (
        <View style={styles.categoryContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(value: string) => setCategory(value)}
            style={styles.picker}
          >
            <Picker.Item label="Select a category" value="" />
            {categories
              .filter(cat => cat.type === type)
              .map((cat) => (
                <Picker.Item 
                  key={cat.id} 
                  label={cat.name} 
                  value={cat.id.toString()} 
                />
              ))}
          </Picker>
          <TouchableOpacity 
            style={styles.addCategoryButton}
            onPress={() => setShowNewCategoryForm(true)}
          >
            <Ionicons name="add-circle" size={24} color="#5E35B1" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.newCategoryForm}>
          <TextInput
            style={styles.input}
            placeholder="New Category Name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <ScrollView horizontal style={styles.iconSelector}>
            {icons.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  selectedIcon === icon && styles.selectedIconButton
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons 
                  name={icon as any} 
                  size={24} 
                  color={selectedIcon === icon ? 'white' : '#5E35B1'} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.newCategoryButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowNewCategoryForm(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]}
              onPress={handleAddCategory}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Ionicons name="camera" size={24} color="#5E35B1" />
        <Text style={styles.imageButtonText}>
          {image ? 'Change Receipt Image' : 'Add Receipt Image'}
        </Text>
      </TouchableOpacity>

      {image && (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      )}

      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onClose}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>
            {loading ? 'Adding...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeTypeButton: {
    backgroundColor: '#5E35B1',
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
    backgroundColor: '#FFFFFF',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  picker: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
  },
  addCategoryButton: {
    marginLeft: 8,
    padding: 8,
  },
  newCategoryForm: {
    marginBottom: 16,
  },
  iconSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  selectedIconButton: {
    backgroundColor: '#5E35B1',
    borderColor: '#5E35B1',
  },
  newCategoryButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    marginBottom: 16,
  },
  imageButtonText: {
    marginLeft: 8,
    color: '#5E35B1',
    fontSize: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttons: {
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
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDDDDD',
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

export default AddTransactionForm; 