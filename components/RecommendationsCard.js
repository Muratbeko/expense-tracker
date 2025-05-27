import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const RecommendationsCard = ({ expensesForecast, incomeForecast, balanceForecast }) => {
  const generateRecommendations = () => {
    const recommendations = [];

    if (balanceForecast?.trend === 'negative') {
      recommendations.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Внимание!',
        text: 'Прогноз показывает отрицательный баланс. Рассмотрите возможность сокращения расходов.'
      });
    }

    if (expensesForecast?.trend === 'increasing') {
      recommendations.push({
        type: 'tip',
        icon: '💡',
        title: 'Совет',
        text: 'Ваши расходы растут. Попробуйте установить бюджетные лимиты по категориям.'
      });
    }

    if (incomeForecast?.trend === 'decreasing') {
      recommendations.push({
        type: 'info',
        icon: 'ℹ️',
        title: 'Информация',
        text: 'Прогнозируется снижение доходов. Подумайте о дополнительных источниках дохода.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        icon: '✅',
        title: 'Отлично!',
        text: 'Ваши финансы находятся в стабильном состоянии. Продолжайте контролировать расходы.'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <View style={styles.recommendationsContainer}>
      <Text style={styles.sectionTitle}>Рекомендации</Text>
      {recommendations.map((rec, index) => (
        <View key={index} style={[styles.recommendationCard, styles[rec.type]]}>
          <Text style={styles.recommendationIcon}>{rec.icon}</Text>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>{rec.title}</Text>
            <Text style={styles.recommendationText}>{rec.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  recommendationCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warning: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tip: {
    backgroundColor: '#d1ecf1',
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  info: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  success: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});

export default RecommendationsCard; 