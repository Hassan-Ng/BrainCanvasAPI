const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: { type: String, default: "Team Workspace" },
  isPublic: { type: Boolean, default: false },
  isFavoriteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  created: { type: Date, default: Date.now },
  edited: { type: Date, default: Date.now },
  comments: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String, default: null },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  canvasData: Object,
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);