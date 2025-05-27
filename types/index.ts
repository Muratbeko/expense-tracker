import { Icon } from "phosphor-react-native";
import React, { ReactNode } from "react";
import {
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle
} from "react-native";

// ========== Component Props Types ==========
export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};

export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;

export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type BackButtonProps = {
  style?: ViewStyle;
  iconSize?: number;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

// ========== Business Logic Types ==========
export interface User {
  id?: number;
  uid?: string;
  email: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
} | null;

export type UserDataType = {
  name: string;
  image?: any;
};

export interface Transaction {
  id?: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: string;
  walletId?: number;
  userId?: number;
  image?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Legacy support
export type TransactionType = Transaction;

export interface Budget {
  id: number;
  month: string;
  year: number;
  total: number;
  spent: number;
  userId?: number;
  categories?: Array<{
    id: number;
    name: string;
    budget: number;
    spent: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavingGoal {
  id?: number;
  name: string;
  description?: string;
  currentAmount: number;
  targetAmount: number;
  targetDate?: string;
  imageUrl?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
}

export type CategoryType = {
  label: string;
  value: string;
  icon: Icon;
  bgColor: string;
};

export type ExpenseCategoriesType = {
  [key: string]: CategoryType;
};

export interface Wallet {
  id: number;
  name: string;
  imageUrl: string;
  balance?: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type WalletType = {
  id?: string;
  name: string;
  amount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  image: any;
  uid?: string;
  created?: Date;
};

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  userId?: number;
  createdAt: string;
}

// ========== API Types ==========
export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type AuthContextType = {
  user: UserType;
  setUser: Function;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
};

// ========== List Component Types ==========
export type TransactionListType = {
  data: Transaction[];
  title?: string;
  loading?: boolean;
  emptyListMessage?: string;
};

export type TransactionItemProps = {
  item: Transaction;
  index: number;
  handleClick: Function;
};

export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

// ========== Screen Props Types ==========
export interface GroupedTransactions {
  [key: string]: Transaction[];
}

// ========== Forecast Types ==========
export interface ForecastData {
  period: string;
  predictions: {
    totalExpenses: number;
    totalIncome: number;
    netBalance: number;
    categoryBreakdown: {
      [category: string]: number;
    };
  };
  trends: {
    expenseTrend: 'UP' | 'DOWN' | 'STABLE';
    incomeTrend: 'UP' | 'DOWN' | 'STABLE';
    suggestions: string[];
  };
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalExpenses: number;
  totalIncome: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  recommendations: string[];
}

export interface CreateNotificationData {
  title: string;
  body: string;
  description?: string;
  notificationType: 'BUDGET_ALERT' | 'TRANSACTION' | 'SYSTEM';
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  userId?: number;
  budgetId?: number;
} 