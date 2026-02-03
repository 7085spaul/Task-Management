import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  completed: z.boolean().optional(),
});

export const tasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['all', 'completed', 'pending']).default('all'),
  search: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TasksQueryInput = z.infer<typeof tasksQuerySchema>;
