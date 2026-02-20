import { Request, Response } from 'express';
import { TodoModel, Todo } from '../models/Todo';

// const getUserId = (req: Request): number | null => {
//   const userId = req.headers['x-user-id'];
//   return userId ? parseInt(userId as string, 10) : null;
// };

export const listTodos = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const todos = await TodoModel.findAllByUserId(userId);
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTodo = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { title, description, due_date, type } = req.body;
  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due_date are required' });
  }

  try {
    const todo: Todo = {
      user_id: userId,
      title,
      description: description || '',
      due_date,
      type: type || 'custom',
      status: 'pending',
    };
    console.log('[Debug] Creating Todo:', todo);
    const newTodo = await TodoModel.create(todo);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('[Create Todo Error]:', error);
    res.status(500).json({ error: 'Failed to save todo', details: (error as Error).message });
  }
};

export const updateTodoStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await TodoModel.updateStatus(Number(id), status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { title, description, due_date, type } = req.body;

  try {
    await TodoModel.update(Number(id), { title, description, due_date, type });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await TodoModel.delete(Number(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
