const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
    res.json(notes);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: 'Прочитано' });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;