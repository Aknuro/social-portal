const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // allow base64 avatar

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/projects',      require('./routes/projects'));
app.use('/api/applications',  require('./routes/applications'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((req, res) => res.status(404).json({ message: 'Маршрут не найден' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Ошибка сервера' }); });

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social-portal';

mongoose.connect(MONGO_URI)
  .then(() => { console.log('MongoDB подключена'); app.listen(PORT, () => console.log(`Сервер: порт ${PORT}`)); })
  .catch(err => console.error('Ошибка MongoDB:', err));
