import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  primary: "#6B46C1",
  primaryLight: "#9F7AEA",
  primaryDark: "#553C9A",
  text: "#2D3748",
  textLight: "#e5e5e5",
  textLighter: "#d4d4d4",
  white: "#fff",
  black: "#000",
  purple:"#5E35B1",
  rose: "#ef4444",
  green: "#16a34a",
  neutral50: "#fafafa",
  neutral100: "#f5f5f5",
  neutral200: "#e5e5e5",
  neutral300: "#d4d4d4",
  neutral350: "#CCCCCC",
  neutral400: "#a3a3a3",
  neutral500: "#737373",
  neutral600: "#525252",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#171717",
 
  gray:"#808080",
  dark: '#111111',
  darkGray: '#1C1C1C',
  darkGray2: '#2A2A2A',
  darkGray3: '#333333',
  

  lightGray: '#CCCCCC',
  
  // Primary colors
  primary2: '#6C5CE7',
  primaryDark2: '#5F4FD3',
   // Background colors
   background: '#FFFFFF',
   surface: '#F7FAFC',
  
   
   // Text colors
   darkText: '#222222',
   lightText: '#FFFFFF',
  // Accent colors
  green2: '#00D4AA',
  red: '#FF6B6B',
  yellow: '#FDD835',
  
  // Success, error, warning
  success: '#48BB78',
  error: '#F56565',
  warning: '#ED8936',
  
  // Black
 
  info: '#4299E1'
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
};

export const spacingY = {
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
};

export const theme = {
  colors: {
    primary: '#5E35B1',
    secondary: '#9E9E9E',
    success: '#4CAF50',
    error: '#F44336',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    border: '#EEEEEE',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};
