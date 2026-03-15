import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { PedidoProdutoSchema } from "@shared/types";
import db from "../dbHelpers";

export default () => {
    const router = express.Router();

    // GET /api/orders — lista todos os pedidos
    router.get("/", async (req: Request, res: Response) => {
        try {
            const orders = await db.order.getAll();
            res.json({ orders });
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            res.status(500).json({ error: "Erro ao buscar pedidos" });
        }
    });

    // GET /api/orders/:id — busca pedido por ID
    router.get("/:id", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" });
            return;
        }
        try {
            const order = await db.order.getById(id);
            if (!order) {
                res.status(404).json({ error: "Pedido não encontrado" });
                return;
            }
            res.json({ order });
        } catch (error) {
            console.error("Erro ao buscar pedido:", error);
            res.status(500).json({ error: "Erro ao buscar pedido" });
        }
    });

    // POST /api/orders — cria um novo pedido
    router.post("/", async (req: Request, res: Response) => {
        const schema = z.object({
            usuarioId: z.number().int().positive(),
            produtos: z.array(PedidoProdutoSchema),
            horario: z.string().optional(),
        });
        const parseResult = schema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: "Dados inválidos", details: parseResult.error });
            return;
        }
        const { usuarioId, produtos, horario } = parseResult.data;
        const preco_total = produtos.reduce((sum, p) => sum + p.preco * p.quantidade, 0);
        try {
            const order = await db.order.create({
                usuarioId,
                produtos,
                horario: horario ?? new Date().toTimeString().slice(0, 5),
                preco_total,
            });
            res.status(201).json({ order });
        } catch (error) {
            console.error("Erro ao criar pedido:", error);
            res.status(500).json({ error: "Erro ao criar pedido" });
        }
    });

    return router;
};
