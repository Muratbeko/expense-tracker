const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Добавляем поддержку для vector-icons
config.resolver.assetExts.push(
  // Добавляем поддержку шрифтов
  'ttf',
  'otf',
  'woff',
  'woff2'
);

// Настройка для работы с проблемными пакетами
config.resolver.unstable_enablePackageExports = false;

module.exports = config;