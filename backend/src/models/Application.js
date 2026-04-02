const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Сообщение при подаче заявки обязательно'],
    minlength: [10, 'Сообщение должно содержать минимум 10 символов'],
    maxlength: [1000, 'Сообщение не должно превышать 1000 символов']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

applicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
