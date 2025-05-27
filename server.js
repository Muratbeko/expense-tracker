const express = require('express');
const cors = require('cors');
const app = express();

// Разрешаем запросы только с вашего мобильного приложения (или с локальной сети, если работаете через IP)
app.use(cors({
  origin: 'http://localhost:8080',  // Укажите URL вашего фронтенда
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Разрешенные методы
  allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
}));

// Остальной код для сервера...
app.listen(8080, () => console.log('Server running on port 8080'));
