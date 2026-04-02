const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 9 } = req.query;
    const filter = { status: 'active' };

    if (category && category !== 'все') filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('organizer', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ projects, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке проектов' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('organizer', 'name avatar bio email');
    if (!project) return res.status(404).json({ message: 'Проект не найден' });

    const applicantCount = await Application.countDocuments({ project: project._id });
    res.json({ project, applicantCount });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке проекта' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, location, startDate, endDate, maxParticipants, tags } = req.body;

    const project = await Project.create({
      title, description, category, location, startDate, endDate, maxParticipants, tags,
      organizer: req.user._id
    });

    await project.populate('organizer', 'name avatar');
    res.status(201).json({ project });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Ошибка при создании проекта' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав для редактирования' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('organizer', 'name avatar');

    res.json({ project: updated });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при обновлении проекта' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав для удаления' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ project: req.params.id });
    res.json({ message: 'Проект удалён' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при удалении проекта' });
  }
});

module.exports = router;