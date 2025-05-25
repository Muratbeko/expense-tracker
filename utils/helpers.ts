// utils/helpers.ts

/**
 * Форматирует число как валюту
 */
export const formatCurrency = (value: number): string => {
    return `$${parseFloat(value?.toString() || '0').toFixed(2)}`;
  };
  
  /**
   * Получает название текущего месяца
   */
  export const getCurrentMonthName = (): string => {
    return new Date().toLocaleString('default', { month: 'long' });
  };
  
  /**
   * Безопасно парсит число из строки
   */
  export const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  /**
   * Проверяет, является ли значение положительным числом
   */
  export const isPositiveNumber = (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0;
  };
  
  /**
   * Вычисляет процент выполнения
   */
  export const calculatePercentage = (current: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };
  
  /**
   * Форматирует дату для отображения
   */
  export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };