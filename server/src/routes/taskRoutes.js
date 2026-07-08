import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get tasks, filtered by project, secured by user's project access
router.get('/', protect, async (req, res) => {
  try {
    // 1. Find all projects the user is owner or member of
    const userProjects = await Project.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    // 2. Build the filter
    const filter = { project: { $in: projectIds } };

    // 3. If a specific project filter is requested, verify access
    if (req.query.project) {
      if (projectIds.map(id => id.toString()).includes(req.query.project)) {
        filter.project = req.query.project;
      } else {
        return res.status(403).json({ message: 'Access denied to this project\'s tasks' });
      }
    }

    const tasks = await Task.find(filter).populate('assignee project', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new task
router.post('/', protect, async (req, res) => {
  try {
    const { project: projectId, title, assignee } = req.body;
    
    // Check if user has access to the project
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!project) {
      return res.status(403).json({ message: 'Cannot add task: project not found or access denied' });
    }

    const task = await Task.create(req.body);

    // Notification if assignee is defined and is not the creator
    if (assignee && assignee.toString() !== req.user.id) {
      await Notification.create({
        user: assignee,
        title: 'New Task Assignment',
        message: `You have been assigned to task: "${title}" in project "${project.name}".`,
        link: '/dashboard'
      });
    }

    const populatedTask = await Task.findById(task._id).populate('assignee project', 'name email');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify project access
    const project = await Project.findOne({
      _id: task.project,
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!project) {
      return res.status(403).json({ message: 'Access denied to this task\'s project' });
    }

    const previousAssignee = task.assignee?.toString();
    const previousStatus = task.status;

    // Update the fields
    Object.assign(task, req.body);
    await task.save();

    // 1. Notify if assignee changed
    if (req.body.assignee && req.body.assignee !== previousAssignee && req.body.assignee !== req.user.id) {
      await Notification.create({
        user: req.body.assignee,
        title: 'Task Assigned',
        message: `You have been assigned to the task: "${task.title}" in project "${project.name}".`,
        link: '/dashboard'
      });
    }

    // 2. Notify if status changed
    if (req.body.status && req.body.status !== previousStatus) {
      const messages = [];
      // Notify assignee if not the person who made the change
      if (task.assignee && task.assignee.toString() !== req.user.id) {
        messages.push({
          user: task.assignee,
          title: 'Task Status Updated',
          message: `The status of your task "${task.title}" was updated to "${req.body.status}" by ${req.user.email}.`,
          link: '/dashboard'
        });
      }
      // Notify project owner if not the person who made the change
      if (project.owner.toString() !== req.user.id) {
        messages.push({
          user: project.owner,
          title: 'Task Status Updated',
          message: `The status of task "${task.title}" in your project "${project.name}" was updated to "${req.body.status}" by ${req.user.email}.`,
          link: '/dashboard'
        });
      }

      if (messages.length > 0) {
        await Notification.insertMany(messages);
      }
    }

    const populatedTask = await Task.findById(task._id).populate('assignee project', 'name email');
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify project access (only project owner or task assignee or member should delete)
    const project = await Project.findOne({
      _id: task.project,
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    });

    if (!project) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
