import * as FileSystem from 'expo-file-system';

const API_KEY = 'AIzaSyCrb5mXO0QP0KII3Fh7D42Tqs_Vph9SD0g';
const API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export const processReceipt = async (imageUri: string) => {
  try {
    // Конвертируем изображение в base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Формируем запрос к API
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 10,
            },
          ],
        },
      ],
    };

    // Отправляем запрос
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Извлекаем текст из ответа
    const text = data.responses[0]?.textAnnotations[0]?.description || '';
    
    // Пытаемся найти сумму в тексте
    const amountMatch = text.match(/(?:ИТОГО|СУММА|СУММА К ОПЛАТЕ)[:\s]+(\d+[.,]\d{2})/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

    // Пытаемся найти название магазина
    const storeMatch = text.match(/(?:ООО|ИП)[\s\S]+?(?=\n)/);
    const store = storeMatch ? storeMatch[0].trim() : 'Неизвестный магазин';

    return {
      amount,
      store,
      rawText: text,
    };
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
}; 