import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { createTaskSchema, updateTaskSchema, tasksQuerySchema } from '../validators/task';

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /tasks - list with pagination, filter (status), search (title)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = tasksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { page, limit, status, search } = parsed.data;
    const userId = req.user!.userId;

    const where: { userId: string; completed?: boolean; title?: { contains: string } } = {
      userId,
    };
    if (status === 'completed') where.completed = true;
    if (status === 'pending') where.completed = false;
    if (search?.trim()) where.title = { contains: search.trim() };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { title } = parsed.data;
    const userId = req.user!.userId;

    const task = await prisma.task.create({
      data: { title, userId },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const task = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// PATCH /tasks/:id
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: parsed.data,
    });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// PATCH /tasks/:id/toggle
router.patch('/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: { completed: !existing.completed },
    });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

export default router;
