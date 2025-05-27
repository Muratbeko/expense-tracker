// services/GeminiForecastService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Замените на ваш Gemini API ключ
const GEMINI_API_KEY = 'AIzaSyA6jcaXfB9KYuOPWnjQMUqnauj47NB3r84'; // Получите ключ на https://makersuite.google.com/app/apikey
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

class GeminiForecastService {
  static async generateExpenseForecast(transactions, period = 'month') {
    try {
      if (!transactions || transactions.length === 0) {
        throw new Error('No transaction data available');
      }

      // Фильтруем только расходы
      const expenses = transactions.filter(tx => tx.type === 'EXPENSE');
      
      if (expenses.length === 0) {
        throw new Error('No expense data available');
      }

      // Анализируем данные
      const analysisData = this.analyzeTransactions(expenses);
      
      // Создаем промт для Gemini
      const prompt = this.createForecastPrompt(analysisData, period);
      
      // Отправляем запрос к Gemini API
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error('No response from Gemini AI');
      }

      // Парсим ответ AI
      const forecast = this.parseAIResponse(aiResponse, period, analysisData);
      
      // Сохраняем в кэш
      await this.cacheForecast(forecast, period);
      
      return forecast;

    } catch (error) {
      console.error('Error generating forecast:', error);
      
      // Возвращаем fallback прогноз
      return this.generateFallbackForecast(transactions, period);
    }
  }

  static analyzeTransactions(expenses) {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Группируем по категориям
    const categoryData = {};
    let totalAmount = 0;
    let totalCount = 0;

    expenses.forEach(expense => {
      const amount = Math.abs(expense.amount);
      totalAmount += amount;
      totalCount++;

      if (!categoryData[expense.category]) {
        categoryData[expense.category] = {
          total: 0,
          count: 0,
          recent: 0,
          transactions: []
        };
      }

      categoryData[expense.category].total += amount;
      categoryData[expense.category].count++;
      categoryData[expense.category].transactions.push(expense);

      // Подсчитываем недавние траты
      const expenseDate = new Date(expense.date);
      if (expenseDate >= oneMonthAgo) {
        categoryData[expense.category].recent += amount;
      }
    });

    // Анализируем тренды по периодам
    const weeklyData = this.getPeriodicData(expenses, 7);
    const monthlyData = this.getPeriodicData(expenses, 30);
    const quarterlyData = this.getPeriodicData(expenses, 90);

    return {
      totalAmount,
      totalCount,
      averageTransaction: totalAmount / totalCount,
      categoryData,
      weeklyData,
      monthlyData,
      quarterlyData,
      topCategories: Object.entries(categoryData)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 5)
        .map(([category, data]) => ({
          category,
          amount: data.total,
          percentage: (data.total / totalAmount) * 100
        }))
    };
  }

  static getPeriodicData(expenses, days) {
    const periods = [];
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const endDate = new Date(now.getTime() - i * days * 24 * 60 * 60 * 1000);
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate < endDate;
      });

      const total = periodExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
      
      periods.push({
        startDate,
        endDate,
        total,
        count: periodExpenses.length,
        average: periodExpenses.length > 0 ? total / periodExpenses.length : 0
      });
    }

    return periods;
  }

  static createForecastPrompt(analysisData, period) {
    const { totalAmount, totalCount, categoryData, weeklyData, monthlyData, topCategories } = analysisData;

    const periodText = {
      week: 'неделю',
      month: 'месяц', 
      year: 'год'
    }[period] || 'месяц';

    return `
Проанализируй финансовые данные пользователя и создай прогноз расходов на ${periodText}.

ДАННЫЕ ДЛЯ АНАЛИЗА:
- Общая сумма расходов: ${totalAmount.toFixed(2)} руб.
- Количество транзакций: ${totalCount}
- Средняя транзакция: ${analysisData.averageTransaction.toFixed(2)} руб.

ТОП КАТЕГОРИИ РАСХОДОВ:
${topCategories.map(cat => `- ${cat.category}: ${cat.amount.toFixed(2)} руб. (${cat.percentage.toFixed(1)}%)`).join('\n')}

ТРЕНДЫ ПО НЕДЕЛЯМ (последние 4 недели):
${weeklyData.map((week, i) => `Неделя ${i+1}: ${week.total.toFixed(2)} руб. (${week.count} транзакций)`).join('\n')}

ТРЕНДЫ ПО МЕСЯЦАМ (последние 4 месяца):
${monthlyData.map((month, i) => `Месяц ${i+1}: ${month.total.toFixed(2)} руб. (${month.count} транзакций)`).join('\n')}

ЗАДАЧА:
Создай прогноз расходов на следующий ${periodText}, учитывая:
1. Сезонные факторы и тренды
2. Регулярные платежи
3. Изменения в тратах по категориям
4. Рекомендации по оптимизации бюджета

ФОРМАТ ОТВЕТА (строго в JSON):
{
  "totalForecast": число,
  "categoryForecasts": {
    "категория1": число,
    "категория2": число
  },
  "trend": "увеличение/уменьшение/стабильно",
  "confidence": число от 0 до 100,
  "recommendations": [
    "рекомендация 1",
    "рекомендация 2"
  ],
  "insights": [
    "инсайт 1",
    "инсайт 2"
  ]
}

Отвечай ТОЛЬКО JSON без дополнительного текста.
`;
  }

  static parseAIResponse(aiResponse, period, analysisData) {
    try {
      // Очищаем ответ от лишнего текста
      let cleanResponse = aiResponse.trim();
      
      // Ищем JSON в ответе
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const parsedResponse = JSON.parse(cleanResponse);

      return {
        period,
        totalForecast: parsedResponse.totalForecast || 0,
        categoryForecasts: parsedResponse.categoryForecasts || {},
        trend: parsedResponse.trend || 'стабильно',
        confidence: parsedResponse.confidence || 70,
        recommendations: parsedResponse.recommendations || [],
        insights: parsedResponse.insights || [],
        generatedAt: new Date().toISOString(),
        source: 'gemini-ai'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.generateFallbackForecast(null, period);
    }
  }

  static generateFallbackForecast(transactions, period) {
    if (!transactions || transactions.length === 0) {
      return {
        period,
        totalForecast: 0,
        categoryForecasts: {},
        trend: 'недостаточно данных',
        confidence: 0,
        recommendations: ['Добавьте больше транзакций для точного прогноза'],
        insights: ['Недостаточно данных для анализа'],
        generatedAt: new Date().toISOString(),
        source: 'fallback'
      };
    }

    const expenses = transactions.filter(tx => tx.type === 'EXPENSE');
    const analysisData = this.analyzeTransactions(expenses);
    
    // Простой расчет на основе средних значений
    const multiplier = {
      week: 0.25,
      month: 1,
      year: 12
    }[period] || 1;

    const avgMonthly = analysisData.monthlyData.reduce((sum, month) => sum + month.total, 0) / 
                      Math.max(analysisData.monthlyData.length, 1);

    return {
      period,
      totalForecast: avgMonthly * multiplier,
      categoryForecasts: Object.entries(analysisData.categoryData).reduce((acc, [category, data]) => {
        acc[category] = (data.total / analysisData.monthlyData.length) * multiplier;
        return acc;
      }, {}),
      trend: 'стабильно',
      confidence: 60,
      recommendations: [
        'Рекомендуем добавить больше данных для улучшения точности прогноза',
        'Следите за регулярными тратами в категориях с наибольшими расходами'
      ],
      insights: [
        `Ваша средняя месячная трата составляет ${avgMonthly.toFixed(2)} руб.`,
        `Наибольшие расходы в категории: ${analysisData.topCategories[0]?.category || 'Другое'}`
      ],
      generatedAt: new Date().toISOString(),
      source: 'fallback'
    };
  }

  static async cacheForecast(forecast, period) {
    try {
      const cacheKey = `forecast_${period}_${new Date().toDateString()}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(forecast));
    } catch (error) {
      console.error('Error caching forecast:', error);
    }
  }

  static async getCachedForecast(period) {
    try {
      const cacheKey = `forecast_${period}_${new Date().toDateString()}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached forecast:', error);
      return null;
    }
  }

  static async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const forecastKeys = keys.filter(key => key.startsWith('forecast_'));
      await AsyncStorage.multiRemove(forecastKeys);
    } catch (error) {
      console.error('Error clearing forecast cache:', error);
    }
  }
}

export default GeminiForecastService;