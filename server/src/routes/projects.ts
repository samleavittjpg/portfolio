import { Router } from 'express';
import { Project } from '../models/Project.js';

export const projectsRouter = Router();

projectsRouter.get('/', async (_req, res, next) => {
  try {
    const projects = await Project.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:slug', async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug }).lean();
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});
