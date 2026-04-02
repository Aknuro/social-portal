const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название проекта обязательно'],
    trim: true,
    minlength: [5, 'Название должно содержать минимум 5 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание проекта обязательно'],
    minlength: [20, 'Описание должно содержать минимум 20 символов']
  },
  category: {
    type: String,
    required: true,
    enum: ['экология', 'образование', 'здоровье', 'культура', 'спорт', 'волонтёрство', 'другое']
  },
  image: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: 'Онлайн'
  },
  startDate: {
    type: Date,
    required: [true, 'Дата начала обязательна']
  },
  endDate: {
    type: Date
  },
  maxParticipants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
