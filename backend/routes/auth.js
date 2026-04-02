const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Заполните все поля' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Пользователь уже существует' });
    const user = new User({ name, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Заполните все поля' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Такого пользователя не существует' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch { res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, city, phone, skills, experience, completedProjects, avatar } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, city, phone, skills, experience, completedProjects, avatar },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch { res.status(500).json({ message: 'Ошибка сервера' }); }
});

router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch { res.status(500).json({ message: 'Ошибка сервера' }); }
});

module.exports = router;
