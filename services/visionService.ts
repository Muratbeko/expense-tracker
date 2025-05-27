import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const GOOGLE_API_KEY = 'AIzaSyCrb5mXO0QP0KII3Fh7D42Tqs_Vph9SD0g';

export interface ReceiptData {
  amount: number;
  description: string;
  category: string;
  merchantName: string;
  date: Date;
  items: string[];
}

interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function processReceipt(imageUri: string): Promise<ReceiptData> {
  try {
    console.log('Исходный URI:', imageUri);

    // Конвертируем изображение в JPEG формат принудительно
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [
        // Изменяем размер если изображение слишком большое
        { resize: { width: 1024 } }
      ],
      {
        compress: 0.8,
        format: SaveFormat.JPEG, // Принудительно JPEG
        base64: false
      }
    );

    console.log('Конвертированный URI:', manipulatedImage.uri);

    // Читаем файл и конвертируем в base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Проверяем, что base64 данные корректны
    if (!base64 || base64.length === 0) {
      throw new Error('Не удалось прочитать изображение');
    }

    console.log('Base64 длина:', base64.length);

    // Всегда используем image/jpeg после конвертации
    const mimeType = 'image/jpeg';

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Проанализируй этот чек и извлеки следующую информацию в формате JSON:
              {
                "amount": число (общая сумма),
                "description": "описание покупки",
                "category": "категория (еда, транспорт, развлечения, покупки, здоровье, другое)",
                "merchantName": "название магазина/заведения",
                "date": "дата в формате YYYY-MM-DD",
                "items": [список товаров, если можно определить]
              }
              
              Если не можешь определить какое-то поле, используй разумные значения по умолчанию.`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    console.log('Отправляем запрос к Google AI...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data: GoogleAIResponse = await response.json();
    console.log('Ответ от API:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Не получен ответ от AI');
    }

    const textResponse = data.candidates[0].content.parts[0].text;

    // Пытаемся извлечь JSON из ответа
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Не удалось найти JSON в ответе AI');
    }

    const receiptData = JSON.parse(jsonMatch[0]);

    // Валидация и установка значений по умолчанию
    return {
      amount: receiptData.amount || 0,
      description: receiptData.description || 'Покупка',
      category: receiptData.category || 'другое',
      merchantName: receiptData.merchantName || 'Неизвестно',
      date: receiptData.date ? new Date(receiptData.date) : new Date(),
      items: receiptData.items || []
    };

  } catch (error: unknown) {
    console.error('Ошибка при обработке чека:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Более детальная обработка ошибок
    if (errorMessage.includes('HEIC') || errorMessage.includes('HEIF')) {
      console.error('Ошибка формата HEIC/HEIF');
      throw new Error('Формат изображения не поддерживается. Попробуйте сделать фото в приложении.');
    }

    if (errorMessage.includes('Base64 decoding failed')) {
      console.error('Ошибка декодирования Base64');
      throw new Error('Ошибка обработки изображения. Попробуйте другое фото.');
    }

    // Возвращаем данные по умолчанию в случае ошибки
    return {
      amount: 0,
      description: 'Ошибка сканирования',
      category: 'другое',
      merchantName: 'Неизвестно',
      date: new Date(),
      items: []
    };
  }
}