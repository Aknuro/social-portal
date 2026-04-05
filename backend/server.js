const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://social-portal-1.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(express.json());

// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Маршрут не найден' }));

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social-portal')
  .then(() => {
    console.log('✅ MongoDB подключена');
    app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
  })
  .catch(err => console.error(err));