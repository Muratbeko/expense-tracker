import Input from '@/components/input'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { verticalScale } from '@/utils/styling'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native'

const Login = () => {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      await login(email, password)
      router.replace('/(tabs)')
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typo size={32} fontWeight="700">
            Welcome Back
          </Typo>
          <Typo size={16} color={colors.neutral400}>
            Sign in to continue
          </Typo>
        </View>

        <View style={styles.form}>
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
            onPress={handleLogin}
            disabled={loading}
          >
            <Typo size={16} color={colors.white} fontWeight="600">
              {loading ? 'Signing in...' : 'Sign In'}
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Typo size={14} color={colors.neutral400}>
              Don't have an account?{' '}
            </Typo>
            <Typo size={14} color={colors.primary} fontWeight="600">
              Sign Up
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Login

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
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacingY._20,
  },
})