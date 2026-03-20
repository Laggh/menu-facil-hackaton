/**
 * Task Types
 * 
 * Tipos TypeScript para o sistema de tasks
 */

// ─── Tipos de Payload por Task Type ─────────────────────────────────────

/**
 * Payload para task de gerar etiqueta de usuário
 */
export interface GenerateUserTagPayload {
    usuarioId: string;
    orderId: string;
}

/**
 * Union type de todos os possíveis payloads
 */
export type TaskPayload = GenerateUserTagPayload;

// ─── Response Types ────────────────────────────────────────────────────

/**
 * Response para GET /api/tasks
 */
export interface GetAllTasksResponse {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    tasks: Task[];
}

/**
 * Response para GET /api/tasks/pending
 */
export interface GetTasksByStatusResponse {
    total: number;
    tasks: Task[];
}

/**
 * Response para GET /api/tasks/processing
 */
export interface GetProcessingTasksResponse {
    total: number;
    tasks: Task[];
}

/**
 * Response para GET /api/tasks/stats
 */
export interface TaskStatsResponse {
    total: number;
    byStatus: {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    byType: {
        GENERATE_USER_TAG: number;
    };
    avgAttempts: string | number;
    maxAttempts: number;
    oldestTask: string | null;
}

/**
 * Response para GET /api/tasks/type/:type
 */
export interface GetTasksByTypeResponse {
    type: string;
    total: number;
    tasks: Task[];
}

/**
 * Response para GET /api/tasks/user/:usuarioId
 */
export interface GetTasksByUserResponse {
    usuarioId: string;
    total: number;
    tasks: Task[];
}

/**
 * Response para GET /api/tasks/:id
 */
export interface GetTaskByIdResponse extends Task {}

/**
 * Response genérica de erro
 */
export interface ErrorResponse {
    error: string;
}

// ─── Task Type (base) ──────────────────────────────────────────────────

/**
 * Interface completa de Task
 * (compatível com shared/index.ts Task)
 */
export interface Task {
    id: string;
    type: TaskType;
    status: TaskStatus;
    payload: Record<string, any>;  // ← Record para compatibilidade com shared
    attempts: number;
    maxAttempts: number;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

/**
 * Tipos de tasks disponíveis
 */
export type TaskType = 'GENERATE_USER_TAG';

/**
 * Status possíveis de uma task
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Type guard para verificar se payload é GenerateUserTagPayload
 */
export function isGenerateUserTagPayload(payload: TaskPayload): payload is GenerateUserTagPayload {
    return (payload as GenerateUserTagPayload).usuarioId !== undefined &&
           (payload as GenerateUserTagPayload).orderId !== undefined;
}

/**
 * Função auxiliar para criar payload correto baseado no tipo
 */
export function createTaskPayload(type: TaskType, data: Record<string, any>): TaskPayload {
    switch (type) {
        case 'GENERATE_USER_TAG':
            return {
                usuarioId: data.usuarioId,
                orderId: data.orderId,
            } as GenerateUserTagPayload;
        default:
            throw new Error(`Tipo de task desconhecido: ${type}`);
    }
}

/**
 * Descrição legível de um tipo de task
 */
export function getTaskTypeDescription(type: TaskType): string {
    const descriptions: Record<TaskType, string> = {
        'GENERATE_USER_TAG': 'Gerar etiqueta de usuário baseado em comportamento',
    };
    return descriptions[type];
}

/**
 * Descrição legível de um status de task
 */
export function getTaskStatusDescription(status: TaskStatus): string {
    const descriptions: Record<TaskStatus, string> = {
        'pending': 'Aguardando execução',
        'processing': 'Sendo executada',
        'completed': 'Completada com sucesso',
        'failed': 'Falhou após máximo de tentativas',
    };
    return descriptions[status];
}
