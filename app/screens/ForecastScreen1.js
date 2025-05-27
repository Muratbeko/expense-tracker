// import { Picker } from '@react-native-picker/picker';
// import React, { useEffect, useState } from 'react';
// import {
//     ActivityIndicator,
//     Alert,
//     RefreshControl,
//     ScrollView,
//     StyleSheet,
//     Text,
//     View
// } from 'react-native';
// import BalanceChart from '../components/BalanceChart';
// import ForecastChart from '../components/ForecastChart';
// import RecommendationsCard from '../components/RecommendationsCard';
// import SeasonalPatterns from '../components/SeasonalPatterns';
// import ForecastService from '../services/ForecastService';

// const ForecastScreen = ({ route }) => {
//   const { userId } = route.params;
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [expensesForecast, setExpensesForecast] = useState(null);
//   const [incomeForecast, setIncomeForecast] = useState(null);
//   const [balanceForecast, setBalanceForecast] = useState(null);
//   const [selectedPeriod, setSelectedPeriod] = useState(30);
//   const [selectedCategory, setSelectedCategory] = useState('');

//   const categories = [
//     { label: 'Все категории', value: '' },
//     { label: 'Продукты', value: 'Продукты' },
//     { label: 'Транспорт', value: 'Транспорт' },
//     { label: 'Развлечения', value: 'Развлечения' },
//     { label: 'Коммунальные услуги', value: 'Коммунальные услуги' },
//     { label: 'Здоровье', value: 'Здоровье' },
//     { label: 'Образование', value: 'Образование' },
//   ];

//   const periods = [
//     { label: '7 дней', value: 7 },
//     { label: '30 дней', value: 30 },
//     { label: '60 дней', value: 60 },
//     { label: '90 дней', value: 90 },
//   ];

//   useEffect(() => {
//     loadForecasts();
//   }, [selectedPeriod, selectedCategory]);

//   const loadForecasts = async () => {
//     try {
//       setLoading(true);
      
//       const [expenses, income, balance] = await Promise.all([
//         ForecastService.getExpensesForecast(
//           userId, 
//           selectedCategory || null, 
//           selectedPeriod
//         ),
//         ForecastService.getIncomeForecast(
//           userId, 
//           selectedCategory || null, 
//           selectedPeriod
//         ),
//         ForecastService.getBalanceForecast(userId, selectedPeriod),
//       ]);

//       setExpensesForecast(expenses);
//       setIncomeForecast(income);
//       setBalanceForecast(balance);
//     } catch (error) {
//       Alert.alert('Ошибка', 'Не удалось загрузить прогнозы');
//       console.error('Error loading forecasts:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadForecasts();
//     setRefreshing(false);
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Загружаем прогнозы...</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView 
//       style={styles.container}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//     >
//       <View style={styles.header}>
//         <Text style={styles.screenTitle}>Финансовые прогнозы</Text>
//         <Text style={styles.subtitle}>
//           Прогнозирование на основе ваших данных
//         </Text>
//       </View>

//       <View style={styles.filtersContainer}>
//         <View style={styles.filterItem}>
//           <Text style={styles.filterLabel}>Период прогноза:</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={selectedPeriod}
//               onValueChange={setSelectedPeriod}
//               style={styles.picker}
//             >
//               {periods.map(period => (
//                 <Picker.Item 
//                   key={period.value} 
//                   label={period.label} 
//                   value={period.value} 
//                 />
//               ))}
//             </Picker>
//           </View>
//         </View>

//         <View style={styles.filterItem}>
//           <Text style={styles.filterLabel}>Категория:</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={selectedCategory}
//               onValueChange={setSelectedCategory}
//               style={styles.picker}
//             >
//               {categories.map(category => (
//                 <Picker.Item 
//                   key={category.value} 
//                   label={category.label} 
//                   value={category.value} 
//                 />
//               ))}
//             </Picker>
//           </View>
//         </View>
//       </View>

//       {/* Прогноз баланса */}
//       {balanceForecast && (
//         <View style={styles.balanceContainer}>
//           <Text style={styles.sectionTitle}>Прогноз баланса</Text>
//           <BalanceChart data={balanceForecast} />
//         </View>
//       )}

//       {/* Прогноз расходов */}
//       <ForecastChart
//         data={expensesForecast}
//         title="Прогноз расходов"
//         color="#FF6B6B"
//       />

//       {/* Прогноз доходов */}
//       <ForecastChart
//         data={incomeForecast}
//         title="Прогноз доходов"
//         color="#4ECDC4"
//       />

//       {/* Сезонные паттерны */}
//       {expensesForecast?.seasonalPatterns && (
//         <SeasonalPatterns patterns={expensesForecast.seasonalPatterns} />
//       )}

//       {/* Рекомендации */}
//       <RecommendationsCard 
//         expensesForecast={expensesForecast}
//         incomeForecast={incomeForecast}
//         balanceForecast={balanceForecast}
//       />
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   header: {
//     padding: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   screenTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#6c757d',
//   },
//   filtersContainer: {
//     backgroundColor: '#fff',
//     padding: 16,
//     marginVertical: 8,
//   },
//   filterItem: {
//     marginBottom: 16,
//   },
//   filterLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#495057',
//     marginBottom: 8,
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: '#dee2e6',
//     borderRadius: 8,
//     backgroundColor: '#f8f9fa',
//   },
//   picker: {
//     height: 50,
//   },
//   balanceContainer: {
//     backgroundColor: '#fff',
//     margin: 16,
//     padding: 16,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#212529',
//     marginBottom: 16,
//   },
// });

// export default ForecastScreen; 