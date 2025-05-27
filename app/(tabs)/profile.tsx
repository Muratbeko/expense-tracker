import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { verticalScale } from '@/utils/styling'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Alert, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native'
import { accountOptionType } from '../types'

const Profile = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  // Debug logs
  useEffect(() => {
    console.log('Profile page - Current user:', user)
    console.log('Profile page - User name:', user?.name)
    console.log('Profile page - User email:', user?.email)
    console.log('Profile page - User imageUrl:', user?.imageUrl)
    
    if (user?.imageUrl) {
      const fullImageUrl = `http://localhost:8080/images/view/${user.imageUrl}`
      console.log('Profile page - Full image URL:', fullImageUrl)
    }
  }, [user])

  const accountOptions: accountOptionType[] = [
    {
      title: "Edit Profile",
      icon: (
        <MaterialIcons 
          name="edit" 
          size={24}
          color={colors.white}
        />
      ),
      routeName: '/(modals)/profileModal',
      bgColor: "#6366f1",
    },
    {
      title: "Settings",
      icon: (
        <Ionicons 
          name="settings-outline" 
          size={24}
          color={colors.white}
        />
      ),
      bgColor: "#059669",
    },
    {
      title: "Privacy Policy",
      icon: (
        <MaterialIcons 
          name="privacy-tip" 
          size={24}
          color={colors.white}
        />
      ),
      bgColor: "#f59e0b",
    },
    {
      title: "Help & Support",
      icon: (
        <MaterialIcons 
          name="help-outline" 
          size={24}
          color={colors.white}
        />
      ),
      bgColor: "#3b82f6",
    },
    {
      title: "Logout",
      icon: (
        <MaterialIcons 
          name="logout" 
          size={24}
          color={colors.white}
        />
      ),
      bgColor: "#e11d48",
    },
  ]

  const showLogoutAlert = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          onPress: () => console.log('Logout cancelled'),
          style: 'cancel',
        },
        {
          text: "Logout",
          onPress: () => {
            console.log('User logging out')
            logout()
          },
          style: 'destructive',
        },
      ]
    )
  }

  const handlePress = (item: accountOptionType) => {
    console.log('Option pressed:', item.title)
    
    if (item.title === 'Logout') {
      showLogoutAlert()
    } else if (item.routeName) {
      console.log('Navigating to:', item.routeName)
      router.push(item.routeName)
    } else {
      // Для других опций пока показываем уведомление
      Alert.alert('Coming Soon', `${item.title} feature is coming soon!`)
    }
  }
  
  // Create the image source with proper URL formatting
  const getImageSource = () => {
    if (user?.imageUrl) {
      const fullUrl = `http://localhost:8080/images/view/${user.imageUrl}`
      console.log('Using image URL:', fullUrl)
      return { uri: fullUrl }
    }
    console.log('Using default avatar')
    return require('@/assets/images/defaultAvatar.png')
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Status Bar */}
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        {/* Custom Header */}
        <View style={styles.header}>
          <Typo size={32} fontWeight="700" color={colors.neutral800}>
            Profile
          </Typo>
        </View>

        {/* User info */}
        <View style={styles.userInfo}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={getImageSource()}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => router.push('/(modals)/profileModal')}
            >
              <MaterialIcons name="edit" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Name & email */}
          <View style={styles.nameContainer}>
            <Typo size={24} fontWeight="600" color={colors.neutral800}>
              {user?.name || 'Loading...'}
            </Typo>
            <Typo size={15} color={colors.neutral600}>
              {user?.email || 'Loading...'}
            </Typo>
          </View>
        </View>
        
        {/* Account options */}
        <View style={styles.accountOptions}>
          {accountOptions.map((item, index) => {
            return (
              <TouchableOpacity
                key={index.toString()}
                style={styles.listItem}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.flexRow}>
                  {/* Icon */}
                  <View
                    style={[
                      styles.listIcon,
                      {
                        backgroundColor: item?.bgColor,
                      },
                    ]}
                  >
                    {item.icon && item.icon}
                  </View>
                  <Typo size={16} style={{ flex: 1 }} fontWeight="500" color={colors.neutral800}>
                    {item.title}
                  </Typo>
                  <MaterialIcons
                    name="chevron-right"
                    size={verticalScale(20)}
                    color={colors.neutral500}
                  />
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    backgroundColor: '#f8fafc', // Светло-серый фон вместо темного
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
    paddingBottom: spacingY._20,
  },
  userInfo: {
    marginTop: verticalScale(20),
    alignItems: "center",
    gap: spacingY._15,
    backgroundColor: colors.white,
    borderRadius: radius._20,
    paddingVertical: spacingY._30,
    paddingHorizontal: spacingX._20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(120),
    width: verticalScale(120),
    borderRadius: verticalScale(60),
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 20,
    backgroundColor: colors.neutral700,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    padding: 8,
  },
  nameContainer: {
    gap: verticalScale(6),
    alignItems: "center",
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._12,
  },
  listItem: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    marginBottom: verticalScale(12),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  accountOptions: {
    marginTop: spacingY._25,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._15,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._15,
  },
})