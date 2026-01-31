import express from 'express';
import { listTodos, createTodo, updateTodoStatus, updateTodo, deleteTodo } from '../controllers/todoController';

const router = express.Router();

router.get('/', listTodos);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.put('/:id/status', updateTodoStatus);
router.delete('/:id', deleteTodo);

export default router;
