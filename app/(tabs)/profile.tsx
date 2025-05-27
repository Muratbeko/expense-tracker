import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { verticalScale } from '@/utils/styling'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Alert, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native'
import { accountOptionType } from '../../types'

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
      const fullImageUrl = `http://${process.env.EXPO_PUBLIC_HOST_IP}:8080/images/view/${user.imageUrl}`
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
      const fullUrl = `http://${process.env.EXPO_PUBLIC_HOST_IP}:8080/images/view/${user.imageUrl}`
      console.log('Using image URL:', fullUrl)
      return { uri: fullUrl }
    }
    console.log('Using default avatar')
    return require('@/assets/images/defaultAvatar.png')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.neutral50} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
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
        
        {/* Bottom spacing for better scroll experience */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default Profile

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacingX._20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
    paddingBottom: spacingY._20,
    paddingHorizontal: spacingX._5,
  },
  userInfo: {
    marginTop: verticalScale(10),
    alignItems: "center",
    gap: spacingY._20,
    backgroundColor: colors.white,
    borderRadius: radius._20,
    paddingVertical: spacingY._35,
    paddingHorizontal: spacingX._20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacingY._25,
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
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    borderRadius: 18,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    padding: 10,
    borderWidth: 3,
    borderColor: colors.white,
  },
  nameContainer: {
    gap: verticalScale(8),
    alignItems: "center",
  },
  listIcon: {
    height: verticalScale(46),
    width: verticalScale(46),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItem: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    marginBottom: verticalScale(12),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.neutral100,
  },
  accountOptions: {
    flex: 1,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._15,
    paddingVertical: spacingY._17,
    paddingHorizontal: spacingX._20,
  },
  bottomSpacing: {
    height: spacingY._40,
  },
})