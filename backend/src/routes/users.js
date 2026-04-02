const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// GET /api/users/profile — get own profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const myProjects = await Project.find({ organizer: req.user._id }).sort({ createdAt: -1 });
    res.json({ user, myProjects });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке профиля' });
  }
});

// PUT /api/users/profile — update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join('. ') });
    }
    res.status(500).json({ message: 'Ошибка при обновлении профиля' });
  }
});

module.exports = router;
