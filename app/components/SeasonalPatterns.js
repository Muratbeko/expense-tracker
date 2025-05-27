import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SeasonalPatterns = ({ patterns }) => {
  if (!patterns || !patterns.weekly) {
    return null;
  }

  const weeklyData = patterns.weekly;
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <View style={styles.patternsContainer}>
      <Text style={styles.sectionTitle}>Сезонные паттерны</Text>
      
      <View style={styles.weeklyPattern}>
        <Text style={styles.patternTitle}>Расходы по дням недели</Text>
        <View style={styles.weeklyChart}>
          {days.map((day, index) => {
            const value = weeklyData[dayKeys[index]] || 0;
            const maxValue = Math.max(...Object.values(weeklyData));
            const height = Math.abs(value) / maxValue * 80;
            
            return (
              <View key={day} style={styles.dayBar}>
                <Text style={styles.dayLabel}>{day}</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: height,
                        backgroundColor: value > 0 ? '#FF6B6B' : '#4ECDC4' 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.dayValue}>
                  {Math.round(Math.abs(value))}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  patternsContainer: {
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
  weeklyPattern: {
    marginBottom: 20,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'end',
    height: 120,
  },
  dayBar: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  dayValue: {
    fontSize: 10,
    color: '#495057',
    marginTop: 4,
  },
});

export default SeasonalPatterns; 