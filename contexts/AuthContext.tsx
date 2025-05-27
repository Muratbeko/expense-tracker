import apiService from '@/app/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { User } from '../types/index';

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
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('userEmail');

      console.log('Loading user - Email:', email || 'Not found');

      if (email) {
        try {
          const userData = await apiService.getProfile(email);
          console.log('User data loaded:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error loading user profile:', error);
          await AsyncStorage.removeItem('userEmail');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error in loadUser:', error);
      setUser(null);
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
      setUser(userData);

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
      setUser(userData);

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
        await apiService.logout();
      } catch (error) {
        console.warn('Server logout failed, continuing with local logout');
      }

      await AsyncStorage.removeItem('userEmail');
      setUser(null);

      console.log('AuthContext: Logout complete, redirecting');
      router.replace("/(auth)/login");
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      Alert.alert("Error", "Network error during logout.");
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
