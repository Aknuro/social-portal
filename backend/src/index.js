const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users', require('./routes/users'));

app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social-portal')
  .then(() => {
    console.log('✅ MongoDB подключена');
    app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  });