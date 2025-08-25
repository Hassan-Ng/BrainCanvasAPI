const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');

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
        if (authorId) filter.author = authorId;

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { description: regex }
            ];
        }

        if (starred === 'true' && req.user) {
            filter.isFavoriteBy = req.user.id; // matches user's favorites
        }

        const projects = await Project.find(filter)
            .sort({ updatedAt: -1 })
            .populate('author') // optional
            .populate('collaborators', 'firstName lastName email');

        const formatted = projects.map(p => ({
            id: p._id,
            name: p.name,
            description: p.description,
            location: p.location,
            created: timeAgo(p.createdAt),
            edited: timeAgo(p.updatedAt),
            author: p.author,
            authorId: p.author?._id,
            isPublic: p.isPublic,
            isFavorite: req.user ? p.isFavoriteBy.includes(req.user.id) : false,
            thumbnail: p.thumbnail,
            collaborators: p.collaborators,
            canvasData: p.canvasData,
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            isPublic = false,
            collaboratorIds = []
        } = req.body;

        const authorId = req.user?.id || '64b7c6f2c13fa2c3e57a8321'; // fallback for now

        const newProject = new Project({
            name,
            description,
            isPublic,
            author: authorId,
            collaborators: collaboratorIds,
            canvasData: {},
        });

        const saved = await newProject.save();

        res.status(201).json({
            id: saved._id,
            name: saved.name,
            description: saved.description,
            location: saved.location,
            created: timeAgo(saved.createdAt),
            edited: timeAgo(saved.updatedAt),
            authorId: saved.author,
            isPublic: saved.isPublic,
            isFavorite: false,
            thumbnail: saved.thumbnail,
            collaborators: saved.collaborators,
            canvasData: saved.canvasData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('author').populate('collaborators', 'firstName lastName email');
        
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isOwner = req.user && project.author.equals(req.user.id);
        const isCollaborator = req.user && project.collaborators.some(c => c._id.equals(req.user.id));

        if (!isOwner && !isCollaborator && !project.isPublic) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({
            ...project.toObject(),
            canEdit: isOwner || isCollaborator, // This tells the frontend to enter view-only mode
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to find project' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!project.author.equals(req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updates = req.body;
        Object.assign(project, updates);
        await project.save();

        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!project.author.equals(req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

router.post('/:id/favorite', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const userId = req.user.id;
        const index = project.isFavoriteBy.indexOf(userId);
        if (index === -1) {
            project.isFavoriteBy.push(userId);
        } else {
            project.isFavoriteBy.splice(index, 1);
        }

        await project.save();
        res.json({ isFavorite: index === -1 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

router.post('/:id/collaborators', async (req, res) => {
    const { userIds } = req.body;
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!project.author.equals(req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        project.collaborators.push(...userIds.filter(id => !project.collaborators.includes(id)));
        await project.save();
        res.json({ message: 'Collaborators added', updatedCollaborators: project.collaborators });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add collaborators' });
    }
});

router.delete('/:id/collaborators/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!project.author.equals(req.user.id)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        project.collaborators = project.collaborators.filter(id => id.toString() !== req.params.userId);
        await project.save();

        res.json({ message: 'Collaborator removed' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove collaborator' });
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
