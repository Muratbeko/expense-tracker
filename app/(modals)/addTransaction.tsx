import Input from '@/components/input'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import apiService from '@/services/api'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'

const AddTransaction = () => {
  const router = useRouter()
  const { type } = useLocalSearchParams<{ type: 'income' | 'expense' }>()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!amount.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      await apiService.createTransaction({
        amount: parseFloat(amount),
        description,
        type: type.toUpperCase(),
        date: new Date().toISOString(),
        walletId: '1', // TODO: Get this from user's selected wallet
      })
      router.back()
    } catch (error) {
      Alert.alert('Error', 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typo size={24} fontWeight="600">
            Add {type === 'income' ? 'Income' : 'Expense'}
          </Typo>
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Typo size={16} color={colors.neutral400}>
              Amount
            </Typo>
            <Input
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo size={16} color={colors.neutral400}>
              Description
            </Typo>
            <Input
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Typo size={16} color={colors.white} fontWeight="600">
              {loading ? 'Adding...' : 'Add Transaction'}
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default AddTransaction

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  content: {
    padding: spacingX._20,
    gap: spacingY._20,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacingY._15,
    borderRadius: radius._15,
    alignItems: 'center',
    marginTop: spacingY._10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}) 