// screens/ForecastScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { apiClient } from '../../api';
import { API_CONFIG, GOOGLE_CONFIG } from '../../constants';

const screenWidth = Dimensions.get('window').width;

// API configuration
const GEMINI_API_URL = `${GOOGLE_CONFIG.GEMINI_API_URL}?key=${GOOGLE_CONFIG.GEMINI_API_KEY}`;

interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface ForecastData {
  period: 'week' | 'month' | 'year';
  predictedExpenses: number;
  confidence: number;
  insights: string[];
  recommendations: string[];
  categoryBreakdown: { [key: string]: number };
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface ChartData {
  labels: string[];
  datasets: [
    {
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }
  ];
}

export default function ForecastScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [forecasts, setForecasts] = useState<{ [key: string]: ForecastData }>({});
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      generateForecasts();
    }
  }, [transactions]);

  useEffect(() => {
    updateChartData();
  }, [selectedPeriod, forecasts]);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchTransactions();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get<Transaction[]>(API_CONFIG.ENDPOINTS.TRANSACTIONS);
      const allTransactions = response.data || [];
      
      // Фильтруем только расходы за последние 6 месяцев для анализа
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentTransactions = allTransactions.filter((tx: Transaction) => {
        const txDate = new Date(tx.date);
        return txDate >= sixMonthsAgo;
      }).map((tx: Transaction) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: typeof tx.category === 'string' 
          ? tx.category 
          : (tx.category as any)?.name || 'Other',
        date: tx.date
      }));

      setTransactions(recentTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const generateForecasts = async () => {
    try {
      const expenses = transactions.filter(tx => tx.type === 'EXPENSE');
      
      if (expenses.length === 0) {
        Alert.alert('No Data', 'Not enough transaction data to generate forecasts');
        return;
      }

      // Генерируем прогнозы для каждого периода
      const periods: ('week' | 'month' | 'year')[] = ['week', 'month', 'year'];
      const forecastPromises = periods.map(period => generateForecastForPeriod(expenses, period));
      
      const results = await Promise.all(forecastPromises);
      
      const newForecasts: { [key: string]: ForecastData } = {};
      periods.forEach((period, index) => {
        newForecasts[period] = results[index];
      });
      
      setForecasts(newForecasts);
    } catch (error) {
      console.error('Error generating forecasts:', error);
      Alert.alert('Error', 'Failed to generate AI forecasts. Please try again.');
    }
  };

  const generateForecastForPeriod = async (expenses: Transaction[], period: 'week' | 'month' | 'year'): Promise<ForecastData> => {
    try {
      // Подготавливаем данные для анализа
      const categoryTotals: { [key: string]: number } = {};
      const monthlyTotals: { [key: string]: number } = {};
      let totalExpenses = 0;

      expenses.forEach(expense => {
        totalExpenses += expense.amount;
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        
        const monthKey = new Date(expense.date).toISOString().substring(0, 7); // YYYY-MM
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
      });

      const avgMonthlyExpenses = totalExpenses / Math.max(Object.keys(monthlyTotals).length, 1);
      
      // Создаем промт для Gemini AI
      const prompt = `
        Проанализируй следующие данные о расходах пользователя и дай прогноз на ${period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'}:

        Общие расходы за последние месяцы: $${totalExpenses.toFixed(2)}
        Средние месячные расходы: $${avgMonthlyExpenses.toFixed(2)}
        
        Расходы по категориям:
        ${Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)
          .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`)
          .join('\n')}
        
        Месячная динамика:
        ${Object.entries(monthlyTotals)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => `- ${month}: $${amount.toFixed(2)}`)
          .join('\n')}

        Пожалуйста, предоставь:
        1. Прогнозируемую сумму расходов на ${period === 'week' ? 'следующую неделю' : period === 'month' ? 'следующий месяц' : 'следующий год'}
        2. Уровень уверенности в прогнозе (0-100%)
        3. 3-4 ключевых инсайта о трендах расходов
        4. 3-4 рекомендации по оптимизации расходов
        5. Прогноз расходов по основным категориям
        6. Общий тренд (растущий/убывающий/стабильный)

        Ответь в JSON формате:
        {
          "predictedAmount": число,
          "confidence": число от 0 до 100,
          "insights": ["инсайт1", "инсайт2", "инсайт3"],
          "recommendations": ["рекомендация1", "рекомендация2", "рекомендация3"],
          "categoryBreakdown": {"категория1": сумма, "категория2": сумма},
          "trend": "increasing/decreasing/stable"
        }
      `;

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      }

      const response = await apiClient.post<GeminiResponse>(GEMINI_API_URL, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      });

      if (!response.data) {
        throw new Error('No response from Gemini API');
      }

      const aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error('No response from Gemini AI');
      }

      // Парсим JSON ответ от AI
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const aiData = JSON.parse(jsonMatch[0]);

      return {
        period,
        predictedExpenses: aiData.predictedAmount || avgMonthlyExpenses * (period === 'week' ? 0.25 : period === 'month' ? 1 : 12),
        confidence: aiData.confidence || 70,
        insights: aiData.insights || ['Insufficient data for detailed analysis'],
        recommendations: aiData.recommendations || ['Track your expenses regularly'],
        categoryBreakdown: aiData.categoryBreakdown || categoryTotals,
        trend: aiData.trend || 'stable'
      };

    } catch (error) {
      console.error(`Error generating ${period} forecast:`, error);
      
      // Fallback: простой расчет без AI
      const avgMonthlyExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0) / Math.max(expenses.length / 30, 1) * 30;
      const multiplier = period === 'week' ? 0.25 : period === 'month' ? 1 : 12;
      
      const categoryTotals: { [key: string]: number } = {};
      expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      });

      return {
        period,
        predictedExpenses: avgMonthlyExpenses * multiplier,
        confidence: 60,
        insights: [
          'Analysis based on historical spending patterns',
          'Consider tracking expenses in more detail for better predictions'
        ],
        recommendations: [
          'Set up budget limits for major categories',
          'Review and optimize recurring expenses'
        ],
        categoryBreakdown: categoryTotals,
        trend: 'stable'
      };
    }
  };

  const updateChartData = () => {
    const forecast = forecasts[selectedPeriod];
    if (!forecast) return;

    const categories = Object.keys(forecast.categoryBreakdown);
    const amounts = Object.values(forecast.categoryBreakdown);

    setChartData({
      labels: categories.slice(0, 6), // Показываем топ 6 категорий
      datasets: [{
        data: amounts.slice(0, 6),
        color: (opacity = 1) => `rgba(94, 53, 177, ${opacity})`,
        strokeWidth: 2
      }]
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'week': return 'На неделю';
      case 'month': return 'На месяц';
      case 'year': return 'На год';
      default: return period;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return '#F44336';
      case 'decreasing': return '#4CAF50';
      case 'stable': return '#FF9800';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#5E35B1" />
        <Text style={styles.loadingText}>Анализируем ваши расходы...</Text>
      </SafeAreaView>
    );
  }

  const currentForecast = forecasts[selectedPeriod];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Прогноз расходов</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#5E35B1" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodButtonText
              ]}>
                {getPeriodLabel(period)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentForecast && (
          <>
            {/* Main Forecast Card */}
            <View style={styles.forecastCard}>
              <View style={styles.forecastHeader}>
                <Text style={styles.forecastTitle}>
                  Прогноз {getPeriodLabel(selectedPeriod).toLowerCase()}
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={getTrendIcon(currentForecast.trend)} 
                    size={20} 
                    color={getTrendColor(currentForecast.trend)} 
                  />
                  <Text style={[styles.trendText, { color: getTrendColor(currentForecast.trend) }]}>
                    {currentForecast.trend === 'increasing' ? 'Рост' : 
                     currentForecast.trend === 'decreasing' ? 'Снижение' : 'Стабильно'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.forecastAmount}>
                {formatCurrency(currentForecast.predictedExpenses)}
              </Text>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Уверенность прогноза:</Text>
                <Text style={styles.confidenceValue}>{currentForecast.confidence}%</Text>
              </View>
              
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceProgress, 
                    { width: `${currentForecast.confidence}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Chart */}
            {chartData && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Прогноз по категориям</Text>
                <BarChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(94, 53, 177, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForLabels: {
                      fontSize: 10
                    }
                  }}
                  style={styles.chart}
                />
              </View>
            )}

            {/* Insights */}
            <View style={styles.insightsCard}>
              <Text style={styles.sectionTitle}>💡 Ключевые инсайты</Text>
              {currentForecast.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightBullet} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsCard}>
              <Text style={styles.sectionTitle}>🎯 Рекомендации</Text>
              {currentForecast.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>

            {/* Category Breakdown */}
            <View style={styles.categoryCard}>
              <Text style={styles.sectionTitle}>📊 Детализация по категориям</Text>
              {Object.entries(currentForecast.categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([category, amount]) => (
                  <View key={category} style={styles.categoryItem}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                  </View>
                ))}
            </View>
          </>
        )}

        {!currentForecast && !loading && (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={64} color="#CCCCCC" />
            <Text style={styles.noDataText}>Недостаточно данных для прогноза</Text>
            <Text style={styles.noDataSubtext}>
              Добавьте больше транзакций для получения точных прогнозов
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedPeriodButton: {
    backgroundColor: '#5E35B1',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  forecastAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5E35B1',
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#757575',
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    backgroundColor: '#5E35B1',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5E35B1',
    marginTop: 6,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5E35B1',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 18,
    color: '#757575',
    marginTop: 16,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});