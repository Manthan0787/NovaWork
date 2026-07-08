import express from 'express';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get projects accessible to the logged-in user (owner or member)
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    }).populate('owner members', 'name email role');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific project by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    }).populate('owner members', 'name email role');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new project
router.post('/', protect, async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, owner: req.user.id });
    
    // Create notifications for members
    if (project.members && project.members.length > 0) {
      const notifications = project.members
        .filter(memberId => memberId.toString() !== req.user.id)
        .map(memberId => ({
          user: memberId,
          title: 'New Project Invitation',
          message: `You have been added to the project: "${project.name}" by ${req.user.email}.`,
          link: '/dashboard'
        }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a project
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const previousMembers = project.members.map(m => m.toString());
    
    // Update fields
    Object.assign(project, req.body);
    await project.save();

    // Determine newly added members for notifications
    if (req.body.members) {
      const currentMembers = req.body.members.map(m => m.toString());
      const newlyAdded = currentMembers.filter(mId => !previousMembers.includes(mId) && mId !== req.user.id);
      
      if (newlyAdded.length > 0) {
        const notifications = newlyAdded.map(memberId => ({
          user: memberId,
          title: 'Added to Project',
          message: `You have been added to the project: "${project.name}".`,
          link: '/dashboard'
        }));
        await Notification.insertMany(notifications);
      }
    }

    const populatedProject = await Project.findById(project._id).populate('owner members', 'name email role');
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a project
router.delete('/:id', protect, async (req, res) => {
  try {
    // Only owner should delete projects
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized to delete' });
    }

    // Clean up notifications related to the project or members, or keep it simple
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
