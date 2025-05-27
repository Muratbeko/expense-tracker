import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiService from '../services/api';
import type { MonthlyReport } from '../types/index';

export default function MonthlyReportScreen() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      await apiService.requestNotificationPermissions();
      await apiService.scheduleMonthlyReportNotification();
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const reportData = await apiService.generateMonthlyReport();
      setReport(reportData);
      
      // Send immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Monthly Report Ready',
          body: `Your monthly report for ${reportData.month} ${reportData.year} is ready to view!`,
          data: { screen: 'monthly-report' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Report</Text>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={generateReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.generateButtonText}>Generate Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {report ? (
        <View style={styles.reportContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.monthYear}>{report.month} {report.year}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={[styles.summaryValue, styles.income]}>
                  {formatCurrency(report.totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
                <Text style={[styles.summaryValue, styles.expense]}>
                  {formatCurrency(report.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {report.categoryBreakdown.map((item: { category: string; amount: number; percentage: number }, index: number) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryPercentage}>{item.percentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${item.percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {report.recommendations.map((recommendation: string, index: number) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="bulb-outline" size={20} color="#5E35B1" />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>No report generated yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Click the "Generate Report" button to create your monthly report
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E35B1',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reportContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#757575',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5E35B1',
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#757575',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
}); 