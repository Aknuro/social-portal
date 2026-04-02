const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// POST /api/applications — apply for a project
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, message } = req.body;
    if (!projectId) return res.status(400).json({ message: 'Укажите проект' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Проект не найден' });
    if (project.status === 'completed') return res.status(400).json({ message: 'Проект уже завершён' });

    // Check already applied
    const existing = await Application.findOne({ user: req.user.id, project: projectId });
    if (existing) return res.status(400).json({ message: 'Вы уже подали заявку на этот проект' });

    // Check spots — count approved applications
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

// GET /api/applications/my
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

// GET /api/applications/check/:projectId
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

// GET /api/applications/project/:projectId — owner sees all
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

// PUT /api/applications/:id/status — approve or reject
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Неверный статус' });

    const app = await Application.findById(req.params.id).populate('project');
    if (!app) return res.status(404).json({ message: 'Заявка не найдена' });
    if (app.project.author.toString() !== req.user.id) return res.status(403).json({ message: 'Нет прав' });

    // If approving — check if spots are full
    if (status === 'approved') {
      const approvedCount = await Application.countDocuments({
        project: app.project._id,
        status: 'approved',
        _id: { $ne: app._id }
      });

      if (approvedCount >= app.project.spots) {
        return res.status(400).json({ message: `Все ${app.project.spots} мест уже заняты` });
      }

      // If this approval fills up all spots — auto-reject everyone else pending
      if (approvedCount + 1 >= app.project.spots) {
        const otherPending = await Application.find({
          project: app.project._id,
          status: 'pending',
          _id: { $ne: app._id }
        });

        // Reject all other pending
        await Application.updateMany(
          { project: app.project._id, status: 'pending', _id: { $ne: app._id } },
          { status: 'rejected' }
        );

        // Send rejection notifications to all of them
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

    // Notify the applicant
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

// DELETE /api/applications/:id — cancel
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
