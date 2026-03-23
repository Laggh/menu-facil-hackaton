import { Router, Request, Response } from 'express';
import db from '../dbHelpers.js';
import type {
    GetAllTasksResponse,
    ErrorResponse,
} from '../types/taskTypes';

export default function taskRoutes() {
    const router = Router();

    /**
     * GET /api/tasks
     * Retorna todas as tasks (completed, failed, pending)
     */
    router.get('/', async (req: Request, res: Response<GetAllTasksResponse | ErrorResponse>) => {
        try {
            // Pegar todas as tasks pendentes (ainda na fila)
            const pendingTasks = await db.task.getAllPending();

            // TODO: Futuramente seria bom manter histórico de tasks completadas/falhas
            // Por enquanto, retornamos apenas as tasks pendentes
            const response: GetAllTasksResponse = {
                total: pendingTasks.length,
                pending: pendingTasks.filter(t => t.status === 'pending').length,
                completed: 0,
                failed: pendingTasks.filter(t => t.status === 'failed').length,
                tasks: pendingTasks.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ),
            };

            res.json(response);
        } catch (error: any) {
            console.error('Erro ao listar todas as tasks:', error);
            res.status(500).json({ error: 'Erro ao listar tasks' });
        }
    });

    return router;
}
