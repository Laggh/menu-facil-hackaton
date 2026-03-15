import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { Redis } from '@upstash/redis'
import { get } from 'http';

import type { Produto, Pedido } from '@shared/types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default {
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

      getById: async (id: number): Promise<Pedido | null> => {
        const orders = await redis.get("orders") as any[];
        return orders?.find((o: any) => o.id === id) || null;
      },

      create: async (order: Omit<Pedido, "id" | "criado_em">): Promise<Pedido> => {
        const orders = await redis.get("orders") as any[];
        const newOrder: Pedido = {
          ...order,
          id: Date.now(),
          criado_em: new Date().toISOString(),
        };
        await redis.set("orders", [...(orders || []), newOrder]);
        return newOrder;
      },
    },

}