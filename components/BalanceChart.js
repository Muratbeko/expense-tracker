import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const BalanceChart = ({ data }) => {
  if (!data || !data.forecast_dates) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>Нет данных для прогноза баланса</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.forecast_dates.slice(0, 7).map(date => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.balance_forecast.slice(0, 7),
        color: (opacity = 1) => {
          const avgBalance = data.balance_forecast.reduce((a, b) => a + b, 0) / data.balance_forecast.length;
          return avgBalance >= 0 
            ? `rgba(76, 217, 100, ${opacity})` 
            : `rgba(255, 59, 48, ${opacity})`;
        },
        strokeWidth: 3,
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
  };

  const avgBalance = data.balance_forecast.reduce((a, b) => a + b, 0) / data.balance_forecast.length;
  const trend = data.trend || (avgBalance >= 0 ? 'positive' : 'negative');

  return (
    <View style={styles.balanceChartContainer}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceTitle}>
          {trend === 'positive' ? '💰' : '⚠️'} Баланс
        </Text>
        <Text style={[
          styles.balanceTrend,
          { color: trend === 'positive' ? '#4CD964' : '#FF3B30' }
        ]}>
          {trend === 'positive' ? 'Положительный' : 'Отрицательный'}
        </Text>
      </View>
      
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      
      <Text style={styles.balanceAverage}>
        Средний баланс: {Math.round(avgBalance)} KGS
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceChartContainer: {
    alignItems: 'center',
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  balanceTrend: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  balanceAverage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    color: '#495057',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default BalanceChart; 