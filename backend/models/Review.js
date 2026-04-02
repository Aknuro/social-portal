const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  rating:  { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// One review per user per project
reviewSchema.index({ project: 1, author: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
