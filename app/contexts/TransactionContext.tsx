import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';

// Создаем контекст
const TransactionContext = createContext();

// Типы экшенов
const ACTIONS = {
  LOAD_TRANSACTIONS: 'LOAD_TRANSACTIONS',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  SET_LOADING: 'SET_LOADING',
};

// Редьюсер для управления состоянием
function transactionReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
        loading: false,
      };
    case ACTIONS.ADD_TRANSACTION:
      const newTransactions = [...state.transactions, action.payload];
      return {
        ...state,
        transactions: newTransactions,
      };
    case ACTIONS.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case ACTIONS.DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}

// Начальное состояние
const initialState = {
  transactions: [],
  loading: true,
};

// Провайдер контекста
export function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);

  // Загружаем транзакции при инициализации
  useEffect(() => {
    loadTransactions();
  }, []);

  // Сохраняем транзакции при изменении (только если не в состоянии загрузки)
  useEffect(() => {
    if (!state.loading && state.transactions.length >= 0) {
      saveTransactions(state.transactions);
    }
  }, [state.transactions, state.loading]);

  // Загрузка транзакций из AsyncStorage
  const loadTransactions = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const stored = await AsyncStorage.getItem('transactions');
      const transactions = stored ? JSON.parse(stored) : [];
      console.log('Загружены транзакции:', transactions);
      dispatch({ type: ACTIONS.LOAD_TRANSACTIONS, payload: transactions });
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
      dispatch({ type: ACTIONS.LOAD_TRANSACTIONS, payload: [] });
    }
  };

  // Сохранение транзакций в AsyncStorage
  const saveTransactions = async (transactions) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      console.log('Транзакции сохранены:', transactions.length);
    } catch (error) {
      console.error('Ошибка сохранения транзакций:', error);
    }
  };

  // Добавление транзакции
  const addTransaction = async (transaction) => {
    try {
      console.log('Добавляем транзакцию в контекст:', transaction);
      
      // Проверяем валидность транзакции
      if (!transaction.id || !transaction.amount || !transaction.description || !transaction.category) {
        throw new Error('Не все обязательные поля заполнены');
      }

      dispatch({ type: ACTIONS.ADD_TRANSACTION, payload: transaction });
      
      // Явно сохраняем после добавления
      const updatedTransactions = [...state.transactions, transaction];
      await saveTransactions(updatedTransactions);
      
      console.log('Транзакция успешно добавлена и сохранена');
      return true;
    } catch (error) {
      console.error('Ошибка добавления транзакции:', error);
      throw error;
    }
  };

  // Обновление транзакции
  const updateTransaction = async (transaction) => {
    try {
      dispatch({ type: ACTIONS.UPDATE_TRANSACTION, payload: transaction });
      
      // Явно сохраняем после обновления
      const updatedTransactions = state.transactions.map(t => 
        t.id === transaction.id ? transaction : t
      );
      await saveTransactions(updatedTransactions);
      
      return true;
    } catch (error) {
      console.error('Ошибка обновления транзакции:', error);
      throw error;
    }
  };

  // Удаление транзакции
  const deleteTransaction = async (id) => {
    try {
      dispatch({ type: ACTIONS.DELETE_TRANSACTION, payload: id });
      
      // Явно сохраняем после удаления
      const updatedTransactions = state.transactions.filter(t => t.id !== id);
      await saveTransactions(updatedTransactions);
      
      return true;
    } catch (error) {
      console.error('Ошибка удаления транзакции:', error);
      throw error;
    }
  };

  // Получение статистики
  const getStats = () => {
    const transactions = state.transactions;
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      total: transactions.length,
    };
  };

  const value = {
    transactions: state.transactions,
    loading: state.loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getStats,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

// Хук для использования контекста
export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransaction должен использоваться внутри TransactionProvider');
  }
  return context;
}