const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Application = require('../models/Application');
const auth = require('../middleware/auth');

// GET /api/reviews/project/:id — get reviews for a project
router.get('/project/:id', async (req, res) => {
  try {
    const reviews = await Review.find({ project: req.params.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/reviews — leave a review (must have approved application)
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;
    if (!projectId || !rating) return res.status(400).json({ message: 'Укажите проект и оценку' });

    // Check user was approved participant
    const app = await Application.findOne({ user: req.user.id, project: projectId, status: 'approved' });
    if (!app) return res.status(403).json({ message: 'Оставить отзыв могут только участники проекта' });

    const existing = await Review.findOne({ project: projectId, author: req.user.id });
    if (existing) return res.status(400).json({ message: 'Вы уже оставили отзыв' });

    const review = new Review({ project: projectId, author: req.user.id, rating, comment });
    await review.save();
    await review.populate('author', 'name avatar');
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Вы уже оставили отзыв' });
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
