const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const {
      public: isPublic,
      starred,
      search,
      authorId
    } = req.query;

    let filter = {};

    if (isPublic === 'true') filter.isPublic = true;
    if (authorId) filter.authorId = authorId;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { description: regex }
      ];
    }

    // If `starred=true`, you'd typically need the user ID from auth middleware
    if (starred === 'true' && req.user) {
      filter.isFavorite = true;
      filter.authorId = req.user.id; // requires auth middleware
    }

    const projects = await Project.find(filter).sort({ edited: -1 });

    const formatted = projects.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      location: p.location,
      created: timeAgo(p.created),
      edited: timeAgo(p.edited),
      comments: p.comments,
      author: p.author,
      authorId: p.authorId,
      isPublic: p.isPublic,
      isFavorite: p.isFavorite,
      thumbnail: p.thumbnail,
      collaborators: p.collaborators,
      canvasData: p.canvasData,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      isPublic = false,
      collaboratorIds = []
    } = req.body;

    // Simulate authenticated user (replace with auth middleware later)
    const mockAuthor = {
      id: '64b7c6f2c13fa2c3e57a8321', // change to ObjectId format
      name: 'Sarah Chen'
    };

    // Prepare collaborators
    const collaborators = collaboratorIds.map(id => ({
      userId: id,
      name: `User ${id.slice(-4)}` // Mock names – in real app, lookup from User model
    }));

    const newProject = new Project({
      name,
      description,
      location: 'Team Workspace',
      isPublic,
      isFavorite: false,
      created: new Date(),
      edited: new Date(),
      comments: 0,
      author: mockAuthor.name,
      authorId: mockAuthor.id,
      thumbnail: null,
      collaborators,
      canvasData: {} // empty for now
    });

    const saved = await newProject.save();

    res.status(201).json({
      id: saved._id,
      name: saved.name,
      description: saved.description,
      location: saved.location,
      created: timeAgo(saved.created),
      edited: timeAgo(saved.edited),
      comments: saved.comments,
      author: saved.author,
      authorId: saved.authorId,
      isPublic: saved.isPublic,
      isFavorite: saved.isFavorite,
      thumbnail: saved.thumbnail,
      collaborators: saved.collaborators,
      canvasData: saved.canvasData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Simple time ago function
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

module.exports = router;
