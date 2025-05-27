
// Определяем базовый URL API в зависимости от платформы и окружения
const getBaseUrl = () => {
  return 'http://localhost:8080';
};

export const API_BASE_URL = getBaseUrl();

// Конфигурация для axios
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 секунд
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Функция для проверки доступности API
export const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      console.error('API health check failed:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
}; 