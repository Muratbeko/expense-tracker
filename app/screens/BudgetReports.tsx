import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const BudgetReports = () => {
  const router = useRouter();

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Typo size={24} color={colors.white}>←</Typo>
        </TouchableOpacity>
        <Typo size={20} fontWeight="700" color={colors.white}>
          Budget Reports
        </Typo>
        <View style={{ width: 24 }} /> {/* Empty view for spacing */}
      </View>

      <View style={styles.content}>
        <Typo size={18} color={colors.white}>
          Budget Reports (Placeholder)
        </Typo>
      </View>
    </ScreenWrapper>
  );
};

export default BudgetReports;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});