import Input from '@/components/input'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { verticalScale } from '@/utils/styling'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'

const Register = () => {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      await register(name, email, password)
      router.replace('/(tabs)')
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typo size={32} fontWeight="700">
            Create Account
          </Typo>
          <Typo size={16} color={colors.neutral400}>
            Sign up to get started
          </Typo>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Typo size={16} color={colors.neutral400}>
              Name
            </Typo>
            <Input
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo size={16} color={colors.neutral400}>
              Email
            </Typo>
            <Input
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo size={16} color={colors.neutral400}>
              Password
            </Typo>
            <Input
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Typo size={16} color={colors.white} fontWeight="600">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Typo size={14} color={colors.neutral400}>
              Already have an account?{' '}
            </Typo>
            <Typo size={14} color={colors.primary} fontWeight="600">
              Sign In
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacingX._20,
  },
  header: {
    marginTop: verticalScale(60),
    gap: spacingY._10,
  },
  form: {
    marginTop: verticalScale(40),
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacingY._20,
  },
})