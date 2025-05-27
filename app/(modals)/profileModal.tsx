import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { verticalScale } from '@/utils/styling'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Platform, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { apiClient } from '../../api'
import { API_CONFIG } from '../../constants'

const ProfileModal = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [image, setImage] = useState<any>(null)
  const router = useRouter()

  // Debug logs
  useEffect(() => {
    console.log('ProfileModal - Current user:', user)
    console.log('ProfileModal - User name:', user?.name)
    console.log('ProfileModal - User imageUrl:', user?.imageUrl)
  }, [user])
  
  useEffect(() => {
    if (user?.imageUrl) {
      const fullImageUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGES}/view/${user.imageUrl}`
      console.log('Setting image with URL:', fullImageUrl)
      setImage({ uri: fullImageUrl })
    }
  }, [user?.imageUrl])

  const pickImage = async () => {
    try {
      // Запрашиваем разрешения
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      
      if (!result.canceled && result.assets[0]) {
        console.log('New image selected:', result.assets[0])
        setImage(result.assets[0])
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const uploadImage = async () => {
    if (!image || !image.uri) {
      console.log('No image to upload')
      return null
    }

    console.log('Uploading image:', image.uri)

    const formData = new FormData()
    
    // Получаем расширение файла
    const uriParts = image.uri.split('.')
    const fileExtension = uriParts[uriParts.length - 1]
    
    formData.append('file', {
      uri: image.uri,
      name: `profile.${fileExtension}`,
      type: `image/${fileExtension}`,
    } as any)

    try {
      const response = await apiClient.post<string>(`${API_CONFIG.ENDPOINTS.IMAGES}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('Upload response status:', response.status)
      
      const responseText = response.data
      console.log('Upload response:', responseText)
      
      if (typeof responseText === 'string') {
        // FIX: fix this dollar sign
        // check first, it might be regix
        const filenameMatch = responseText.match(/успешно: (.+)$/)
        if (filenameMatch && filenameMatch[1]) {
          console.log('Extracted filename:', filenameMatch[1])
          return filenameMatch[1]
        }
      }
      throw new Error('Could not extract filename from response')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty')
      return
    }

    try {
      setLoading(true)
      let imageUrl = user?.imageUrl || ''

      // Проверяем, изменилось ли изображение
      const currentImageUri = user?.imageUrl ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGES}/view/${user.imageUrl}` : null
      const hasNewImage = image && image.uri !== currentImageUri

      console.log('Current image URI:', currentImageUri)
      console.log('New image URI:', image?.uri)
      console.log('Has new image:', hasNewImage)

      if (hasNewImage) {
        console.log('Uploading new image...')
        imageUrl = await uploadImage() || ''
        console.log('New image URL:', imageUrl)
      }

      console.log('Updating profile with:', {
        email: user?.email,
        name: name.trim(),
        imageUrl,
      })

      await apiClient.put(`${API_CONFIG.ENDPOINTS.USERS}/me/update`, {
        email: user?.email,
        name: name.trim(),
        imageUrl,
      })

      // Обновляем профиль в контексте
      await updateProfile(user?.email || '')
      
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', `Failed to update profile: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    router.back()
  }

  const getImageSource = () => {
    if (image) {
      console.log('Using image:', image.uri)
      return image
    }
    console.log('Using default avatar')
    return require('@/assets/images/defaultAvatar.png')
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.neutral900} />
        
        {/* Header with gradient */}
        <LinearGradient
          colors={[colors.neutral900, colors.neutral800]}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Typo size={20} fontWeight="700" color={colors.white}>
            Edit Profile
          </Typo>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Profile Image Section with gradient background */}
        <LinearGradient
          colors={[colors.neutral800, colors.neutral700]}
          style={styles.imageSection}
        >
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            <Image
              source={getImageSource()}
              style={styles.profileImage}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.editOverlay}
            >
              <MaterialIcons name="photo-camera" size={28} color={colors.white} />
              <Typo size={12} color={colors.white} fontWeight="500">
                Change Photo
              </Typo>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* User info preview */}
          <View style={styles.userPreview}>
            <Typo size={16} color={colors.neutral300} style={styles.emailText}>
              {user?.email}
            </Typo>
          </View>
        </LinearGradient>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputHeader}>
              <MaterialIcons name="person" size={20} color={colors.neutral600} />
              <Typo size={14} color={colors.neutral600} fontWeight="600">
                Full Name
              </Typo>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.neutral500}
            />
          </View>

          {/* Additional Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color={colors.neutral600} />
              <View style={styles.infoContent}>
                <Typo size={12} color={colors.neutral500}>Email Address</Typo>
                <Typo size={14} color={colors.neutral700} fontWeight="500">
                  {user?.email}
                </Typo>
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [colors.neutral600, colors.neutral700] : ['#6366f1', '#8b5cf6']}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <MaterialIcons name="hourglass-empty" size={20} color={colors.white} />
                  <Typo color={colors.white} size={16} fontWeight="600">
                    Saving...
                  </Typo>
                </View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <MaterialIcons name="save" size={20} color={colors.white} />
                  <Typo color={colors.white} size={16} fontWeight="600">
                    Save Changes
                  </Typo>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    paddingTop: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(25),
  },
  backButton: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: verticalScale(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: verticalScale(40),
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  imageContainer: {
    position: 'relative',
    width: verticalScale(140),
    height: verticalScale(140),
    borderRadius: verticalScale(70),
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral300,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: verticalScale(50),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  userPreview: {
    marginTop: spacingY._15,
    alignItems: 'center',
  },
  emailText: {
    opacity: 0.8,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingX._20,
    marginBottom: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    marginBottom: spacingY._10,
  },
  input: {
    backgroundColor: colors.neutral50,
    borderRadius: radius._10,
    padding: spacingX._15,
    fontSize: 16,
    color: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral200,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingX._20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._15,
  },
  infoContent: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._25,
    paddingTop: spacingY._15,
  },
  saveButton: {
    borderRadius: radius._15,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    paddingVertical: spacingY._20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
})

export default ProfileModal