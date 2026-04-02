const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const projects = await Project.find(filter).populate('author', 'name').sort({ createdAt: -1 });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const projects = await Project.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const total     = await Project.countDocuments();
    const active    = await Project.countDocuments({ status: 'active' });
    const completed = await Project.countDocuments({ status: 'completed' });
    res.json({ total, active, completed });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('author', 'name');
    if (!project) return res.status(404).json({ message: 'Проект не найден' });

    const reviews = await Review.find({ project: req.params.id });
    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ ...project.toObject(), avgRating, reviewCount: reviews.length });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, location, date, spots, image } = req.body;
    if (!title || !description || !category || !location || !date || !spots)
      return res.status(400).json({ message: 'Заполните все обязательные поля' });
    const project = new Project({ title, description, category, location, date, spots, image, author: req.user.id });
    await project.save();
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.author.toString() !== req.user.id) return res.status(403).json({ message: 'Нет прав' });
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.author.toString() !== req.user.id) return res.status(403).json({ message: 'Нет прав' });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Проект удалён' });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;