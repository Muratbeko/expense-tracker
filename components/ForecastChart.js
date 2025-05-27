import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const ForecastChart = ({ data, title, color = '#007AFF' }) => {
  if (!data || !data.forecastDates || data.forecastDates.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>Недостаточно данных для прогноза</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.forecastDates.slice(0, 7).map(date => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.forecastValues.slice(0, 7),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: data.confidenceLower.slice(0, 7),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity * 0.3})`,
        strokeWidth: 1,
        withDots: false,
      },
      {
        data: data.confidenceUpper.slice(0, 7),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity * 0.3})`,
        strokeWidth: 1,
        withDots: false,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
  };

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendText = () => {
    switch (data.trend) {
      case 'increasing':
        return 'Растущий тренд';
      case 'decreasing':
        return 'Убывающий тренд';
      case 'stable':
        return 'Стабильный тренд';
      default:
        return 'Недостаточно данных';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.trendContainer}>
          <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          <Text style={styles.trendText}>{getTrendText()}</Text>
        </View>
      </View>
      
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Средний прогноз</Text>
          <Text style={styles.statValue}>
            {Math.round(data.forecastValues.reduce((a, b) => a + b, 0) / data.forecastValues.length)} KGS
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Максимум</Text>
          <Text style={styles.statValue}>
            {Math.round(Math.max(...data.forecastValues))} KGS
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Минимум</Text>
          <Text style={styles.statValue}>
            {Math.round(Math.min(...data.forecastValues))} KGS
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  trendText: {
    fontSize: 14,
    color: '#6c757d',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  noData: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    marginTop: 20,
  },
});

export default ForecastChart; 