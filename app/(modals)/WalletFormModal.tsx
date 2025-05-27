import Button from '@/components/Button';
import ScreenWrapper from '@/components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Wallet = {
  id?: number;
  name: string;
  imageUrl?: string;
};

export default function WalletFormModal() {
  const router = useRouter();
  const { wallet } = useLocalSearchParams() as { wallet?: string };

  const [name, setName] = useState('');
  const [image, setImage] = useState<any>(null);
  const [existingWallet, setExistingWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (wallet) {
      const parsed = JSON.parse(wallet);
      console.log('Parsed wallet:', parsed);
      setExistingWallet(parsed);
      setName(parsed.name);
      if (parsed.imageUrl) {
        const fullImageUrl = `http://localhost:8080/images/view/${parsed.imageUrl}`;
        console.log('Setting image URL:', fullImageUrl);
        setImage({ uri: fullImageUrl });
        console.log('Image state set:', { uri: fullImageUrl });
      } else {
        console.log('No imageUrl in parsed wallet');
      }
    }
  }, [wallet]);

  const handleClose = () => {
    router.back();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const uploadImage = async () => {
    if (!image || !image.uri) return null;

    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      name: 'wallet.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch('http://localhost:8080/api/wallets/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) throw new Error('Upload failed');
      const imageUrl = await response.text();
      return imageUrl;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Ошибка', 'Введите название кошелька');
      return;
    }

    let imageUrl = existingWallet?.imageUrl || null;

    if (image && (!existingWallet || image.uri !== `http://localhost:8080/images/view/${existingWallet.imageUrl}`)) {
      const uploaded = await uploadImage();
      if (uploaded) imageUrl = uploaded;
    }

    const walletData = { name, imageUrl };
    console.log('Saving wallet with data:', walletData);

    try {
      const url = existingWallet
        ? `http://localhost:8080/api/wallets/${existingWallet.id}`
        : 'http://localhost:8080/api/wallets';
      const method = existingWallet ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletData),
      });

      console.log('Save response status:', response.status);
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить');
    }
  };

  const handleDelete = async () => {
    if (!existingWallet?.id) return;
    
    Alert.alert(
      'Подтверждение',
      'Вы уверены, что хотите удалить этот кошелек?',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`http://localhost:8080/api/wallets/${existingWallet.id}`, {
                method: 'DELETE',
              });
              handleClose();
            } catch (e) {
              Alert.alert('Ошибка', 'Не удалось удалить кошелек');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {existingWallet ? 'Edit Wallet' : 'Add Wallet'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Wallet Name */}
          <Text style={styles.label}>Wallet Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter wallet name"
            placeholderTextColor="#666666"
            value={name}
            onChangeText={setName}
          />

          {/* Wallet Icon */}
          <Text style={styles.label}>Wallet Icon</Text>
          <TouchableOpacity style={styles.iconPicker} onPress={pickImage}>
            {image ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: image.uri }} 
                  style={styles.image}
                  onError={(error) => {
                    console.error('Image load error:', error);
                    console.log('Failed to load image:', image.uri);
                  }}
                  onLoad={() => console.log('Image loaded successfully:', image.uri)}
                />
                <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="image-outline" size={32} color="#666666" />
                <Text style={styles.placeholderText}>Select wallet icon</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {existingWallet && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
            )}
            
            <Button onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>
                {existingWallet ? 'Update Wallet' : 'Add Wallet'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconPicker: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#757575',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#5E35B1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});