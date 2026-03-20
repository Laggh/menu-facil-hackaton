import db from './dbHelpers';
import * as ai from './aiHelpers';

/**
 * Task Worker
 * 
 * Sistema de fila para executar tarefas que falharam inicialmente.
 * Executa a cada 1 minuto.
 */

let isRunning = false;

async function executeTask(task: any) {
    try {
        console.log(`[TASK] Executando tarefa: ${task.id} (tipo: ${task.type}, tentativa: ${task.attempts}/${task.maxAttempts})`);
        
        switch (task.type) {
            case 'GENERATE_USER_TAG': {
                // Recuperar dados do payload
                const { usuarioId, orderId } = task.payload;
                
                if (!usuarioId || !orderId) {
                    throw new Error('Payload inválido: usuarioId ou orderId faltando');
                }
                
                // Buscar usuário e pedido
                const usuario = await db.user.getById(usuarioId);
                if (!usuario) {
                    throw new Error(`Usuário ${usuarioId} não encontrado`);
                }
                
                const completedOrder = await db.order.getById(orderId);
                if (!completedOrder) {
                    throw new Error(`Pedido ${orderId} não encontrado`);
                }
                
                // Buscar últimos 5 pedidos completados
                const allUserOrders = await db.order.getByUserId(usuarioId);
                const completedOrders = allUserOrders
                    .filter((o: any) => o.status === 'COMPLETO' && o.id !== orderId)
                    .sort((a: any, b: any) => Number(b.id) - Number(a.id))
                    .slice(0, 5);
                
                // Se houver prompt salvo no payload, usar o prompt original (retry com estado anterior)
                let novaEtiqueta: string | undefined;
                let error: string | undefined;
                
                if (task.payload.prompt) {
                    console.log(`[TASK] 🔄 Usando prompt original salvo da tentativa anterior`);
                    try {
                        const response = await ai.quickGenerate(task.payload.prompt);
                        if (!response) {
                            throw new Error('Nenhuma resposta da IA');
                        }
                        novaEtiqueta = response
                            .replace(/^```(?:json)?\s*/i, '')
                            .replace(/\s*```$/, '')
                            .replace(/^["']|["']$/g, '')
                            .trim();
                    } catch (promptError: any) {
                        error = promptError?.message || String(promptError);
                    }
                } else {
                    // Comportamento normal: gerar novo prompt
                    const result = await ai.generateUserTag(usuario, completedOrder, completedOrders);
                    novaEtiqueta = result.data;
                    error = result.error;
                }
                
                if (error) {
                    throw new Error(`Erro ao gerar etiqueta: ${error}`);
                }
                
                if (!novaEtiqueta) {
                    throw new Error('Etiqueta vazia retornada pela IA');
                }
                
                // Atualizar usuário
                await db.user.update(usuarioId, { etiqueta: novaEtiqueta });
                
                console.log(`[TASK] ✅ Tarefa concluída: ${task.id}`);
                console.log(`[TASK]    Usuário ${usuarioId} atualizado com nova etiqueta`);
                
                // Marcar como completa
                await db.task.complete(task.id);
                return true;
            }
            
            default:
                throw new Error(`Tipo de tarefa desconhecido: ${task.type}`);
        }
    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.error(`[TASK] ❌ Erro ao executar tarefa ${task.id}: ${errorMessage}`);
        
        // Marcar como falha (vai para fila novamente se tentativas restarem)
        await db.task.fail(task.id, errorMessage);
        return false;
    }
}

export async function startTaskWorker() {
    console.log('[TASK WORKER] Iniciando task worker (executa a cada 1 minuto)');
    
    // Executar toda hora
    setInterval(async () => {
        if (isRunning) {
            console.log('[TASK WORKER] Ciclo anterior ainda rodando, ignorando...');
            return;
        }
        
        isRunning = true;
        
        try {
            const task = await db.task.getNextPending();
            
            if (task) {
                console.log(`[TASK WORKER] Trovaram ${1} tarefa(s) para executar`);
                await executeTask(task);
            } else {
                //console.log('[TASK WORKER] Nenhuma tarefa pendente');
            }
        } catch (error: any) {
            console.error('[TASK WORKER] Erro ao buscar próxima tarefa:', error?.message);
        } finally {
            isRunning = false;
        }
    }, 60 * 1000); // 60 segundos = 1 minuto
}

export async function createTaskGenerateUserTag(usuarioId: string, orderId: string) {
    return await db.task.create('GENERATE_USER_TAG', { usuarioId, orderId });
}

export default {
    startTaskWorker,
    createTaskGenerateUserTag,
};
