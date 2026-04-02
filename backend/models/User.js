const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar:   { type: String, default: '' }, // base64 or URL
  bio:      { type: String, default: '' },
  city:     { type: String, default: '' },
  phone:    { type: String, default: '' },
  skills:   [{ type: String }],
  experience:        { type: String, default: '' },
  completedProjects: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
