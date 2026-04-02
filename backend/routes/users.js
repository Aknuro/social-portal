const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения'));
    }
  },
});

router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Имя должно содержать минимум 2 символа'),
    body('bio').optional().isLength({ max: 300 }).withMessage('Описание не должно превышать 300 символов'),
    body('phone').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.bio !== undefined) updates.bio = req.body.bio;
      if (req.body.phone !== undefined) updates.phone = req.body.phone;
      if (req.file) updates.avatar = `/uploads/avatars/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      res.json({ message: 'Профиль обновлён', user });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Введите текущий пароль'),
    body('newPassword').isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const user = await User.findById(req.user._id);
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Текущий пароль введён неверно.' });
      }

      user.password = req.body.newPassword;
      await user.save();

      res.json({ message: 'Пароль изменён успешно.' });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/my-projects', protect, async (req, res, next) => {
  try {
    const projects = await Project.find({ organizer: req.user._id })
      .populate('participantsCount')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

module.exports = router;