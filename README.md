# Expense Tracker Mobile App

A React Native mobile application for tracking expenses, built with Expo and integrated with a Spring Boot backend.

## Features

- User authentication (login/register)
- Profile management with image upload
- Expense tracking
- Modern and intuitive UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Spring Boot backend running locally

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd expense-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the Spring Boot backend:
```bash
# Navigate to your Spring Boot project directory
cd ../expense-tracker-backend
./mvnw spring-boot:run
```

4. Start the Expo development server:
```bash
npm start
# or
yarn start
```

5. Run on your device:
- Install the Expo Go app on your mobile device
- Scan the QR code from the terminal
- Or press 'a' for Android emulator or 'i' for iOS simulator

## Project Structure

```
expense-tracker/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (modals)/
│   │   └── profileModal.tsx
│   └── (tabs)/
│       └── profile.tsx
├── components/
│   ├── Input.tsx
│   ├── ScreenWrapper.tsx
│   └── Typo.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   └── api.ts
└── constants/
    └── theme.ts
```

## API Integration

The app communicates with a Spring Boot backend running on `http://192.168.0.109::8080`. Make sure your backend is running and accessible before using the app.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
