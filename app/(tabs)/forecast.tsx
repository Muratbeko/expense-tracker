import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { API_BASE_URL } from '../../api';

const screenWidth = Dimensions.get('window').width;

// Инициализация Gemini
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

interface Transaction {
  id: number;
  amount: number;
  category: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
}

interface ForecastData {
  monthly: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  categories: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
}

interface Recommendation {
  title: string;
  description: string;
}

export default function ForecastScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загрузка транзакций
      const response = await axios.get<Transaction[]>(`${API_BASE_URL}/api/transactions`);
      const transactionsData = response.data;
      setTransactions(transactionsData);

      // Анализ данных с помощью Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Подготовка данных для анализа
      const analysisPrompt = `
        Analyze the following transaction data and provide:
        1. Spending patterns and trends
        2. Category-wise analysis
        3. Monthly spending forecast
        4. Personalized recommendations
        
        Transaction data:
        ${JSON.stringify(transactionsData)}
      `;

      const result = await model.generateContent(analysisPrompt);
      const analysis = result.response.text();
      
      // Парсинг ответа Gemini
      const parsedAnalysis = parseGeminiResponse(analysis);
      setForecast(parsedAnalysis.forecast);
      setRecommendations(parsedAnalysis.recommendations);

    } catch (error) {
      console.error('Error loading forecast data:', error);
      Alert.alert('Error', 'Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const parseGeminiResponse = (response: string): { forecast: ForecastData; recommendations: Recommendation[] } => {
    // Здесь должна быть логика парсинга ответа Gemini
    // Это пример структуры
    return {
      forecast: {
        monthly: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            data: [1000, 1200, 900, 1100, 1300, 1400]
          }]
        },
        categories: {
          labels: ['Food', 'Transport', 'Entertainment'],
          datasets: [{
            data: [500, 300, 400]
          }]
        }
      },
      recommendations: [
        {
          title: 'Spending Pattern',
          description: 'Your spending has increased by 20% this month'
        },
        {
          title: 'Category Analysis',
          description: 'Food expenses are higher than usual'
        }
      ]
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading forecast...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Financial Forecast</Text>
        <Text style={styles.subtitle}>AI-powered insights and predictions</Text>
      </View>

      {forecast && (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Monthly Spending Forecast</Text>
            <LineChart
              data={forecast.monthly}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationText}>{rec.description}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
}); 