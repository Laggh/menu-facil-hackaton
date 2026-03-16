import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Redis } from '@upstash/redis'
import { get } from 'http';

import type { Produto, Pedido, GeminiLog, Usuario } from '@shared/types';

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

      updateStatus: async (id: string, status: 'PENDENTE' | 'COMPLETO' | 'CANCELADO'): Promise<Pedido | null> => {
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

}