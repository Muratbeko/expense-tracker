import apiService from '@/services/api';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCredentials, setUserCredentials] = useState<{ email: string; password: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('userEmail');
      let password: string | null = null;
      
      try {
        password = await SecureStore.getItemAsync('userPassword'); // Using secure storage for password
      } catch (secureStoreError) {
        console.warn('SecureStore not available, trying AsyncStorage fallback');
        password = await AsyncStorage.getItem('userPassword');
      }

      console.log('Loading user - Email:', email || 'Not found');

      if (email) {
        // Store credentials in state for logout
        if (password) {
          setUserCredentials({ email, password });
        }
        
        try {
          const userData = await apiService.getProfile(email);
          console.log('User data loaded:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error loading user profile:', error);
          await AsyncStorage.removeItem('userEmail');
          try {
            await SecureStore.deleteItemAsync('userPassword');
          } catch {
            await AsyncStorage.removeItem('userPassword');
          }
          setUser(null);
          setUserCredentials(null);
        }
      } else {
        setUser(null);
        setUserCredentials(null);
      }
    } catch (error) {
      console.error('Error in loadUser:', error);
      setUser(null);
      setUserCredentials(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Starting login process');

      const userData = await apiService.login(email, password);
      console.log('AuthContext: Login successful, saving data');

      await AsyncStorage.setItem('userEmail', email);
      try {
        await SecureStore.setItemAsync('userPassword', password); // Using secure storage for password
      } catch (secureStoreError) {
        console.warn('SecureStore not available, using AsyncStorage fallback');
        await AsyncStorage.setItem('userPassword', password);
      }
      setUser(userData);
      setUserCredentials({ email, password });

      console.log('AuthContext: User set, login complete');
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Starting registration process');

      const userData = await apiService.register(name, email, password);
      console.log('AuthContext: Registration successful, saving data');

      await AsyncStorage.setItem('userEmail', email);
      try {
        await SecureStore.setItemAsync('userPassword', password); // Using secure storage for password
      } catch (secureStoreError) {
        console.warn('SecureStore not available, using AsyncStorage fallback');
        await AsyncStorage.setItem('userPassword', password);
      }
      setUser(userData);
      setUserCredentials({ email, password });

      console.log('AuthContext: User set, registration complete');
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('AuthContext: Starting logout process');

      try {
        // Pass stored credentials to logout API
        await apiService.logout(userCredentials?.email, userCredentials?.password);
        console.log('AuthContext: Server logout successful');
      } catch (error) {
        console.warn('AuthContext: Server logout failed, continuing with local logout:', error);
      }

      // Clear local storage
      await AsyncStorage.removeItem('userEmail');
      try {
        await SecureStore.deleteItemAsync('userPassword');
      } catch {
        await AsyncStorage.removeItem('userPassword');
      }
      console.log('AuthContext: Local storage cleared');
      
      // Clear user state
      setUser(null);
      setUserCredentials(null);
      console.log('AuthContext: User state cleared');

      console.log('AuthContext: Logout complete, redirecting to login');
      router.replace("/(auth)/login");
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      Alert.alert("Error", "Network error during logout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (email: string) => {
    try {
      const userData = await apiService.getProfile(email);
      setUser(userData);
      console.log('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
