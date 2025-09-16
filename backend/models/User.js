const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, default: null },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String }, // hashed if local signup
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);