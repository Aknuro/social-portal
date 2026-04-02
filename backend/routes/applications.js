const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { projectId, message } = req.body;
    if (!projectId) return res.status(400).json({ message: 'Укажите проект' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.status === 'completed') return res.status(400).json({ message: 'Проект уже завершён' });

    const existing = await Application.findOne({ user: req.user.id, project: projectId });
    if (existing) return res.status(400).json({ message: 'Вы уже подали заявку на этот проект' });

    const approvedCount = await Application.countDocuments({ project: projectId, status: 'approved' });
    if (approvedCount >= project.spots) {
      return res.status(400).json({ message: 'Все места уже заняты' });
    }

    const app = new Application({ user: req.user.id, project: projectId, message });
    await app.save();
    res.status(201).json(app);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user.id })
      .populate('project', 'title category date location status')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/check/:projectId', auth, async (req, res) => {
  try {
    const app = await Application.findOne({ user: req.user.id, project: req.params.projectId });
    const project = await Project.findById(req.params.projectId);
    const approvedCount = await Application.countDocuments({ project: req.params.projectId, status: 'approved' });
    const spotsFull = project ? approvedCount >= project.spots : false;
    res.json({ applied: !!app, status: app?.status || null, spotsFull, approvedCount, spots: project?.spots });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.author.toString() !== req.user.id) return res.status(403).json({ message: 'Нет прав' });

    const apps = await Application.find({ project: req.params.projectId })
      .populate('user', 'name bio city skills experience completedProjects avatar')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Неверный статус' });

    const app = await Application.findById(req.params.id).populate('project');
    if (!app) return res.status(404).json({ message: 'Заявка не найдена' });
    if (app.project.author.toString() !== req.user.id) return res.status(403).json({ message: 'Нет прав' });

    if (status === 'approved') {
      const approvedCount = await Application.countDocuments({
        project: app.project._id,
        status: 'approved',
        _id: { $ne: app._id }
      });

      if (approvedCount >= app.project.spots) {
        return res.status(400).json({ message: `Все ${app.project.spots} мест уже заняты` });
      }

      if (approvedCount + 1 >= app.project.spots) {
        const otherPending = await Application.find({
          project: app.project._id,
          status: 'pending',
          _id: { $ne: app._id }
        });

        await Application.updateMany(
          { project: app.project._id, status: 'pending', _id: { $ne: app._id } },
          { status: 'rejected' }
        );

        const notifications = otherPending.map(a => ({
          user: a.user,
          message: `❌ К сожалению, все места на проект «${app.project.title}» заняты. Ваша заявка отклонена.`,
          link: `/projects/${app.project._id}`
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    app.status = status;
    await app.save();

    const msg = status === 'approved'
      ? `✅ Ваша заявка на проект «${app.project.title}» принята!`
      : `❌ Ваша заявка на проект «${app.project.title}» отклонена.`;

    await Notification.create({
      user: app.user,
      message: msg,
      link: `/projects/${app.project._id}`
    });

    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Заявка не найдена' });
    if (app.user.toString() !== req.user.id) return res.status(403).json({ message: 'Нет прав' });
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Заявка отменена' });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;