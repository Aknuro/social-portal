const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { projectId, message } = req.body;
    if (!projectId || !message) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.organizer.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Нельзя подать заявку на свой проект' });
    }

    const existing = await Application.findOne({ project: projectId, applicant: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'Вы уже подали заявку на этот проект' });
    }

    if (project.maxParticipants > 0) {
      const count = await Application.countDocuments({ project: projectId, status: 'approved' });
      if (count >= project.maxParticipants) {
        return res.status(400).json({ message: 'Все места заняты' });
      }
    }

    const application = await Application.create({
      project: projectId, applicant: req.user._id, message
    });

    await application.populate('project', 'title category');
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Вы уже подали заявку на этот проект' });
    }
    res.status(500).json({ message: 'Ошибка при подаче заявки' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('project', 'title category startDate location organizer')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке заявок' });
  }
});

router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    const applications = await Application.find({ project: req.params.projectId })
      .populate('applicant', 'name email avatar bio')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке заявок' });
  }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Неверный статус' });
    }

    const application = await Application.findById(req.params.id).populate('project');
    if (!application) return res.status(404).json({ message: 'Заявка не найдена' });
    if (application.project.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    application.status = status;
    await application.save();
    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при обновлении заявки' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Заявка не найдена' });
    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Нельзя отозвать заявку с этим статусом' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Заявка отозвана' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при отзыве заявки' });
  }
});

module.exports = router;