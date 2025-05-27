import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Wallet = {
  id: number;
  name: string;
  imageUrl?: string;
};

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const router = useRouter();

  const fetchWallets = async () => {
    try {
      console.log('Fetching wallets from:', 'http://localhost:8080/api/wallets');
      const response = await fetch('http://localhost:8080/api/wallets');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text(); // Сначала получаем текст ответа
      console.log('Raw response:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      // Проверяем, что data это массив
      if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        throw new Error('Invalid data format: expected array');
      }

      // Проверяем структуру каждого кошелька
      const validWallets = data.filter(wallet => {
        const isValid = wallet && typeof wallet === 'object' && 
                       typeof wallet.id === 'number' && 
                       typeof wallet.name === 'string';
        if (!isValid) {
          console.warn('Invalid wallet data:', wallet);
        }
        return isValid;
      });

      console.log('Valid wallets:', validWallets);
      setWallets(validWallets);
    } catch (error) {
      console.error('Ошибка загрузки кошельков:', error);
      Alert.alert(
        'Ошибка', 
        'Не удалось загрузить кошельки. Пожалуйста, попробуйте позже или обратитесь в поддержку.'
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallets();
    }, [])
  );

  const handleWalletPress = (item: Wallet) => {
    router.push({
      pathname: '/(modals)/WalletFormModal',
      params: { wallet: JSON.stringify(item) },
    });
  };

  const handleAddWallet = () => {
    router.push('/(modals)/WalletFormModal');
  };

  const renderItem = ({ item }: { item: Wallet }) => {
    // Формируем полный URL для изображения
    const imageUrl = `http://localhost:8080/images/view/${item.imageUrl}`;
    
    // Выводим URL изображения в консоль
   // console.log('Image URL:', imageUrl);

    return (
      <TouchableOpacity
        style={styles.walletItem}
        onPress={() => handleWalletPress(item)}
        activeOpacity={0.7}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.walletImage}
          />
        ) : (
          <View style={styles.walletPlaceholder}>
            <Ionicons name="wallet-outline" size={24} color="#666666" />
          </View>
        )}
        <Text style={styles.walletName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#666666" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallets</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWallet}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Wallets List */}
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

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
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5E35B1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    padding: 16,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  walletImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  walletPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  chevron: {
    marginLeft: 10,
    color: '#757575',
  },
});