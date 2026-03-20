import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Redis } from '@upstash/redis'
import { get } from 'http';

import type { Produto, Pedido, GeminiLog, Usuario, Task } from '@shared/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default {
    redis,
    get: redis.get,
    set: redis.set,
    del: redis.del,
    exists: redis.exists,

    product: {
      getById: async (id: number): Promise<Produto | null> => {
        const products = await redis.get("products") as any[];
        return products?.find((p: any) => p.id === id) || null;
      },

      create: async (product: Omit<Produto, "id">): Promise<Produto> => {
        const products = await redis.get("products") as any[];
        const newProduct = { ...product, id: Date.now() };
        await redis.set("products", [...(products || []), newProduct]);
        return newProduct;
      },

      update: async (id: number, updatedFields: Partial<Omit<Produto, "id">>): Promise<Produto | null> => {
        const products = await redis.get("products") as any[];
        const index = products?.findIndex((p: any) => p.id === id);
        if (index === -1 || index === undefined) return null;
        const updatedProduct = { ...products[index], ...updatedFields };
        products[index] = updatedProduct;
        await redis.set("products", products);
        return updatedProduct;
      },

      delete: async (id: number): Promise<boolean> => {
        const products = await redis.get("products") as any[];
        const newProducts = products?.filter((p: any) => p.id !== id);
        if (newProducts?.length === products?.length) return false; // Não encontrou o produto
        await redis.set("products", newProducts);
        return true;
      },

    },

    order: {
      getAll: async (): Promise<Pedido[]> => {
        const orders = await redis.get("orders") as any[];
        return orders || [];
      },

      getById: async (id: string): Promise<Pedido | null> => {
        const orders = await redis.get("orders") as any[];
        return orders?.find((o: any) => o.id === id) || null;
      },

      getByUserId: async (usuarioId: string): Promise<Pedido[]> => {
        const orders = await redis.get("orders") as any[];
        return orders?.filter((o: any) => o.usuarioId === usuarioId) || [];
      },

      create: async (order: Omit<Pedido, "id" | "criado_em" | "status">): Promise<Pedido> => {
        const orders = await redis.get("orders") as any[];
        const newOrder: Pedido = {
          ...order,
          id: Date.now().toString(),
          status: "PENDENTE",
          criado_em: new Date().toISOString(),
        };
        await redis.set("orders", [...(orders || []), newOrder]);
        return newOrder;
      },

      updateStatus: async (id: string, status: 'PENDENTE' | 'COMPLETO' | 'CANCELADO' | 'ARQUIVADO'): Promise<Pedido | null> => {
        const orders = await redis.get("orders") as any[];
        const index = orders?.findIndex((o: any) => o.id === id);
        if (index === -1 || index === undefined) return null;
        
        const updatedOrder: Pedido = {
          ...orders[index],
          status,
          completado_em: status === 'COMPLETO' ? new Date().toISOString() : undefined,
        };
        orders[index] = updatedOrder;
        await redis.set("orders", orders);
        return updatedOrder;
      },
    },

    log: {
      gemini: async (logData: GeminiLog): Promise<void> => {
        try {
          await redis.lpush("gemini_log", JSON.stringify(logData));
        } catch (error) {
          console.error("Erro ao fazer log da requisição Gemini:", error);
        }
      },
    },

    user: {
      getById: async (id: string): Promise<Usuario | null> => {
        const user = await redis.get(`user:${id}`) as Usuario | null;
        return user;
      },

      getByEmail: async (email: string): Promise<Usuario | null> => {
        // Busca através da chave "user:emails" que mapeia email -> id
        const userId = await redis.get(`user:email:${email}`) as string | null;
        if (!userId) return null;
        return await redis.get(`user:${userId}`) as Usuario | null;
      },

      create: async (userData: Omit<Usuario, "id">): Promise<Usuario> => {
        const newUser: Usuario = {
          ...userData,
          id: Date.now().toString(),
        };
        await redis.set(`user:${newUser.id}`, newUser);
        // Mapear email -> id para busca rápida
        await redis.set(`user:email:${newUser.email}`, newUser.id);
        return newUser;
      },

      update: async (id: string, updatedFields: Partial<Omit<Usuario, "id">>): Promise<Usuario | null> => {
        const user = await redis.get(`user:${id}`) as Usuario | null;
        if (!user) return null;
        
        const updatedUser: Usuario = { ...user, ...updatedFields };
        await redis.set(`user:${id}`, updatedUser);
        
        // Se email foi alterado, atualizar mapeamento
        if (updatedFields.email && updatedFields.email !== user.email) {
          await redis.del(`user:email:${user.email}`);
          await redis.set(`user:email:${updatedFields.email}`, id);
        }
        
        return updatedUser;
      },
    },

    task: {
      create: async (taskType: 'GENERATE_USER_TAG', payload: Record<string, any>): Promise<Task> => {
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: taskType,
          status: 'pending',
          payload,
          attempts: 0,
          maxAttempts: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Salvar na fila (usando LPUSH para FIFO)
        await redis.lpush("task_queue", JSON.stringify(newTask));
        // Também salvar com chave única para recuperação por ID
        await redis.set(`task:${newTask.id}`, newTask);
        
        return newTask;
      },

      getNextPending: async (): Promise<Task | null> => {
        // RPOP pega o último adicionado (FIFO - first in, first out)
        const taskItem = await redis.rpop("task_queue") as any;
        if (!taskItem) return null;
        
        let task: Task;
        if (typeof taskItem === 'string') {
          task = JSON.parse(taskItem);
        } else {
          task = taskItem;
        }
        
        // Marcar como processando
        task.status = 'processing';
        task.attempts += 1;
        task.updatedAt = new Date().toISOString();
        
        // Atualizar no DB
        await redis.set(`task:${task.id}`, task);
        
        return task;
      },

      complete: async (id: string): Promise<Task | null> => {
        const task = await redis.get(`task:${id}`) as Task | null;
        if (!task) return null;
        
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        
        await redis.set(`task:${id}`, task);
        
        return task;
      },

      fail: async (id: string, error: string): Promise<Task | null> => {
        const task = await redis.get(`task:${id}`) as Task | null;
        if (!task) return null;
        
        task.lastError = error;
        task.updatedAt = new Date().toISOString();
        
        // Se atingiu max attempts, marca como failed. Senão, volta para pending
        if (task.attempts >= task.maxAttempts) {
          task.status = 'failed';
        } else {
          task.status = 'pending';
          // Recolocar na fila para tentar depois
          await redis.lpush("task_queue", JSON.stringify(task));
        }
        
        await redis.set(`task:${id}`, task);
        
        return task;
      },

      getAllPending: async (): Promise<Task[]> => {
        const queue = await redis.lrange("task_queue", 0, -1) as any[];
        if (!queue || queue.length === 0) return [];
        return queue.map(item => {
          // Se for string, parsear. Se for objeto, retornar direto
          if (typeof item === 'string') {
            return JSON.parse(item);
          }
          return item;
        });
      },

      getById: async (id: string): Promise<Task | null> => {
        const task = await redis.get(`task:${id}`) as Task | null;
        return task;
      },
    },

}