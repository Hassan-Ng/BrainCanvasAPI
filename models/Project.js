const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: String,
  isPublic: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  edited: { type: Date, default: Date.now },
  comments: { type: Number, default: 0 },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: String, // URL or base64 string
  collaborators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String
  }],
  canvasData: mongoose.Schema.Types.Mixed, // Or define schema if structured
});

module.exports = mongoose.model('Project', projectSchema);
