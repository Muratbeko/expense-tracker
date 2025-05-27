# Expense Tracker Mobile App

A comprehensive mobile application for tracking personal finances, built with React Native and Expo.

## Project Overview

This expense tracker app allows users to:
- Track income and expenses
- Manage different wallets
- Create and monitor budgets
- Add transactions via voice input, photos, or manual entry
- View financial forecasts powered by AI
- Set and track savings goals

## Project Structure

The app follows a modern file structure for React Native applications:

```
expense-tracker/
├── app/               # Main application code using Expo Router
│   ├── (auth)/        # Authentication related screens
│   ├── (expenses)/    # Expense management screens
│   ├── (income)/      # Income management screens
│   ├── (modals)/      # Modal screens
│   ├── (tabs)/        # Tab navigator screens
│   ├── components/    # Reusable UI components
│   ├── config/        # App configuration
│   │   ├── api.ts     # Centralized API client
│   │   └── constants.ts # Application constants and config
│   ├── contexts/      # React contexts for state management
│   ├── screens/       # Additional screens
│   ├── services/      # API services
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── assets/            # Static assets (images, fonts)
├── components/        # Legacy components (being migrated)
└── types/             # Legacy type definitions (being migrated)
```

## Recent Improvements

The codebase has undergone significant improvements to enhance maintainability, security, and code quality:

1. **Centralized API Management**
   - Created a unified `apiClient` instance in `app/config/api.ts`
   - Replaced multiple axios instances with the centralized client
   - Standardized error handling and request configuration

2. **Configuration Management**
   - Moved all configuration values to `app/config/constants.ts`
   - Removed hardcoded API keys and URLs from components
   - Organized configuration by domain (API, Google Services, etc.)

3. **TypeScript Improvements**
   - Added proper TypeScript interfaces for API responses
   - Fixed type errors throughout the codebase
   - Improved type safety for data handling

4. **Code Organization**
   - Consolidated duplicate code and functionality
   - Migrated code from legacy directories to the new app structure
   - Improved folder organization following Expo Router conventions

5. **Security Enhancements**
   - Moved sensitive API keys to environment variables
   - Added fallback mechanisms for missing environment variables
   - Improved error handling for sensitive operations

## Key Technologies

- **Frontend Framework**: React Native, Expo
- **Navigation**: Expo Router
- **API Communication**: Axios
- **State Management**: React Context
- **Charts**: react-native-chart-kit
- **AI Integration**: Google Gemini, Google Speech-to-Text
- **UI Components**: Custom components with standard React Native primitives

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the required environment variables:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://your-api-url
   EXPO_PUBLIC_API_TIMEOUT=10000
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY=your_speech_api_key
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Building for Production

To create a production build:

```
eas build --platform ios
eas build --platform android
```

## Future Improvements

- Complete the migration of legacy code to the new app structure
- Enhance offline capabilities with local storage
- Implement comprehensive unit and integration tests
- Add data visualization improvements with advanced charts
- Integrate more AI-driven insights and recommendations

## License

This project is licensed under the MIT License - see the LICENSE file for details.
