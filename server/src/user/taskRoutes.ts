import { Router, Request, Response } from 'express';
import db from '../dbHelpers';
import type {
    GetAllTasksResponse,
    GetTasksByStatusResponse,
    GetProcessingTasksResponse,
    TaskStatsResponse,
    GetTasksByTypeResponse,
    GetTasksByUserResponse,
    GetTaskByIdResponse,
    ErrorResponse,
    TaskType,
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

    /**
     * GET /api/tasks/pending
     * Retorna apenas tasks com status 'pending'
     */
    router.get('/pending', async (req: Request, res: Response<GetTasksByStatusResponse | ErrorResponse>) => {
        try {
            const pendingTasks = await db.task.getAllPending();

            const filtered = pendingTasks.filter(t => t.status === 'pending');

            res.json({
                total: filtered.length,
                tasks: filtered.sort((a, b) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                ),
            });
        } catch (error: any) {
            console.error('Erro ao listar tasks pendentes:', error);
            res.status(500).json({ error: 'Erro ao listar tasks pendentes' });
        }
    });

    /**
     * GET /api/tasks/processing
     * Retorna apenas tasks com status 'processing'
     */
    router.get('/processing', async (req: Request, res: Response<GetProcessingTasksResponse | ErrorResponse>) => {
        try {
            const allTasks = await db.task.getAllPending();
            const filtered = allTasks.filter(t => t.status === 'processing');

            res.json({
                total: filtered.length,
                tasks: filtered,
            });
        } catch (error: any) {
            console.error('Erro ao listar tasks em processamento:', error);
            res.status(500).json({ error: 'Erro ao listar tasks em processamento' });
        }
    });

    /**
     * GET /api/tasks/stats
     * Retorna estatísticas de tasks
     */
    router.get('/stats', async (req: Request, res: Response<TaskStatsResponse | ErrorResponse>) => {
        try {
            const allTasks = await db.task.getAllPending();

            const stats = {
                total: allTasks.length,
                byStatus: {
                    pending: allTasks.filter(t => t.status === 'pending').length,
                    processing: allTasks.filter(t => t.status === 'processing').length,
                    completed: 0, // TODO: trazer do histórico
                    failed: allTasks.filter(t => t.status === 'failed').length,
                },
                byType: {
                    GENERATE_USER_TAG: allTasks.filter(t => t.type === 'GENERATE_USER_TAG').length,
                },
                avgAttempts: allTasks.length > 0 
                    ? (allTasks.reduce((sum, t) => sum + t.attempts, 0) / allTasks.length).toFixed(2)
                    : 0,
                maxAttempts: 5,
                oldestTask: allTasks.length > 0 
                    ? allTasks.reduce((oldest, t) => 
                        new Date(t.createdAt) < new Date(oldest.createdAt) ? t : oldest
                    ).createdAt
                    : null,
            };

            res.json(stats);
        } catch (error: any) {
            console.error('Erro ao gerar estatísticas de tasks:', error);
            res.status(500).json({ error: 'Erro ao gerar estatísticas' });
        }
    });

    /**
     * GET /api/tasks/type/:type
     * Retorna tasks de um tipo específico
     */
    router.get('/type/:type', async (req: Request, res: Response<GetTasksByTypeResponse | ErrorResponse>) => {
        try {
            const { type } = req.params as { type: TaskType };

            // Validar tipo
            if (type !== 'GENERATE_USER_TAG') {
                res.status(400).json({ error: `Tipo de task desconhecido: ${type}` });
                return;
            }

            const allTasks = await db.task.getAllPending();
            const filtered = allTasks.filter(t => t.type === type);

            res.json({
                type,
                total: filtered.length,
                tasks: filtered.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ),
            });
        } catch (error: any) {
            console.error(`Erro ao listar tasks do tipo ${req.params.type}:`, error);
            res.status(500).json({ error: 'Erro ao listar tasks por tipo' });
        }
    });

    /**
     * GET /api/tasks/user/:usuarioId
     * Retorna tasks relacionadas a um usuário específico
     */
    router.get('/user/:usuarioId', async (req: Request, res: Response<GetTasksByUserResponse | ErrorResponse>) => {
        try {
            const { usuarioId } = req.params;

            const allTasks = await db.task.getAllPending();
            const filtered = allTasks.filter(
                t => t.payload.usuarioId === usuarioId
            );

            res.json({
                usuarioId,
                total: filtered.length,
                tasks: filtered.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ),
            });
        } catch (error: any) {
            console.error('Erro ao listar tasks do usuário:', error);
            res.status(500).json({ error: 'Erro ao listar tasks do usuário' });
        }
    });

    /**
     * GET /api/tasks/:id
     * Retorna detalhes de uma task específica
     */
    router.get('/:id', async (req: Request, res: Response<GetTaskByIdResponse | ErrorResponse>) => {
        try {
            const { id } = req.params;

            // Tentar pegar por task ID completo
            let task = await db.task.getById(id);

            if (!task) {
                // Se não encontrou, tentar em todas as tasks (por se o ID for parcial)
                const allTasks = await db.task.getAllPending();
                task = allTasks.find(t => t.id.includes(id)) || null;
            }

            if (!task) {
                res.status(404).json({ error: `Task não encontrada: ${id}` });
                return;
            }

            res.json(task);
        } catch (error: any) {
            console.error('Erro ao buscar task:', error);
            res.status(500).json({ error: 'Erro ao buscar task' });
        }
    });

    return router;
}
