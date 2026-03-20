import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { PedidoProdutoSchema, Pedido } from "@shared/types";
import db from "../dbHelpers";
import ai from "../aiHelpers";

export default () => {
    const router = express.Router();

    // POST /api/orders — cria um novo pedido
    router.post("/", async (req: Request, res: Response) => {
        const userId = req.headers["x-user-id"] as string | undefined;
        
        if (!userId) {
            res.status(401).json({ error: "x-user-id header é obrigatório" });
            return;
        }

        const schema = z.object({
            produtos: z.array(PedidoProdutoSchema),
            horario: z.string().optional(),
        });

        const parseResult = schema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: "Dados inválidos", details: parseResult.error });
            return;
        }

        const { produtos, horario } = parseResult.data;
        const preco_total = produtos.reduce((sum, p) => sum + p.preco * p.quantidade, 0);

        try {
            const order = await db.order.create({
                usuarioId: userId,
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

    // GET /api/orders/user — lista pedidos do usuário autenticado
    router.get("/user", async (req: Request, res: Response) => {
        const userId = req.headers["x-user-id"] as string | undefined;
        
        if (!userId) {
            res.status(401).json({ error: "x-user-id header é obrigatório" });
            return;
        }

        try {
            const orders = await db.order.getByUserId(userId);
            
            // Separar pendentes e completos
            const pendentes = orders.filter(o => o.status === 'PENDENTE');
            const completos = orders.filter(o => o.status === 'COMPLETO');
            const cancelados = orders.filter(o => o.status === 'CANCELADO');
            const arquivados = orders.filter(o => o.status === 'ARQUIVADO');
            
            res.json({ 
                orders,
                pendentes,
                completos,
                cancelados,
                arquivados
            });
        } catch (error) {
            console.error("Erro ao buscar pedidos do usuário:", error);
            res.status(500).json({ error: "Erro ao buscar pedidos" });
        }
    });

    // GET /api/orders — lista todos os pedidos (admin)
    router.get("/", async (req: Request, res: Response) => {
        try {
            const orders = await db.order.getAll();
            
            // Separar por status para facilitar visualização
            const pendentes = orders.filter(o => o.status === 'PENDENTE');
            const completos = orders.filter(o => o.status === 'COMPLETO');
            const cancelados = orders.filter(o => o.status === 'CANCELADO');
            const arquivados = orders.filter(o => o.status === 'ARQUIVADO');
            
            res.json({ 
                orders,
                pendentes,
                completos,
                cancelados,
                arquivados
            });
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            res.status(500).json({ error: "Erro ao buscar pedidos" });
        }
    });

    // GET /api/orders/latest — retorna o último pedido do usuário autenticado
    router.get("/latest", async (req: Request, res: Response) => {
        const userId = req.headers["x-user-id"] as string | undefined;
        
        if (!userId) {
            res.status(401).json({ error: "x-user-id header é obrigatório" });
            return;
        }

        try {
            const orders = await db.order.getByUserId(userId);
            
            if (!orders || orders.length === 0) {
                res.status(404).json({ error: "Nenhum pedido encontrado" });
                return;
            }

            // Pegar o pedido mais recente (o primeiro quando ordenado por ID descrescente)
            const latestOrder = orders.sort((a: any, b: any) => Number(b.id) - Number(a.id))[0];
            
            res.json({ order: latestOrder });
        } catch (error) {
            console.error("Erro ao buscar último pedido:", error);
            res.status(500).json({ error: "Erro ao buscar último pedido" });
        }
    });

    // GET /api/orders/:id — busca pedido por ID
    router.get("/:id", async (req: Request, res: Response) => {
        const { id } = req.params;
        
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

    // PUT /api/orders/:id/status — atualiza status do pedido (admin)
    router.put("/:id/status", async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        // Validar status
        if (!['PENDENTE', 'COMPLETO', 'CANCELADO', 'ARQUIVADO'].includes(status)) {
            res.status(400).json({ error: "Status inválido. Use: PENDENTE, COMPLETO, CANCELADO ou ARQUIVADO" });
            return;
        }

        try {
            // Buscar o pedido ANTES de atualizar para saber qual era o status anterior
            const orderBefore = await db.order.getById(id);
            if (!orderBefore) {
                res.status(404).json({ error: "Pedido não encontrado" });
                return;
            }

            const previousStatus = orderBefore.status;
            const updatedOrder = await db.order.updateStatus(id, status);
            if (!updatedOrder) {
                res.status(404).json({ error: "Pedido não encontrado" });
                return;
            }

            // APENAS gerar/atualizar a etiqueta quando transição é PENDENTE → COMPLETO
            // Não fazer nada ao desarquivar ou fazer outras transições
            if (previousStatus === 'PENDENTE' && status === 'COMPLETO') {
                try {
                    const usuario = await db.user.getById(updatedOrder.usuarioId);
                    if (usuario) {
                        // Buscar os últimos 5 pedidos completados do usuário (excluindo o atual)
                        const allUserOrders = await db.order.getByUserId(updatedOrder.usuarioId);
                        const completedOrders = allUserOrders
                            .filter((o: any) => o.status === 'COMPLETO' && o.id !== updatedOrder.id)
                            .sort((a: any, b: any) => Number(b.id) - Number(a.id))
                            .slice(0, 5); // Últimos 5 pedidos

                        const { data: novaEtiqueta, error: tagError, taskCreated } = await ai.generateUserTag(usuario, updatedOrder, completedOrders);
                        
                        if (novaEtiqueta && !tagError) {
                            // Atualizar o usuário com a nova etiqueta
                            await db.user.update(usuario.id, { etiqueta: novaEtiqueta });
                            console.log(`✅ Etiqueta atualizada para usuário ${usuario.id}:`, novaEtiqueta);
                        } else if (taskCreated) {
                            // Se houve erro mas uma task foi criada, logar isso
                            console.warn(`⏳ Task criada para gerar etiqueta (ID: ${taskCreated}) - Será executada em breve. Erro detalhes:`, tagError);
                        } else {
                            console.warn(`❌ Erro ao gerar etiqueta para usuário ${usuario.id}:`, tagError);
                        }
                    }
                } catch (tagError) {
                    // Não falha a requisição se houver erro na geração de etiqueta
                    console.error("❌ Erro ao processar etiqueta do usuário:", tagError);
                }
            }

            res.json({ order: updatedOrder });
        } catch (error) {
            console.error("Erro ao atualizar status do pedido:", error);
            res.status(500).json({ error: "Erro ao atualizar status do pedido" });
        }
    });

    // PUT /api/orders/:id/archive — arquiva um pedido
    router.put("/:id/archive", async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const updatedOrder = await db.order.updateStatus(id, "ARQUIVADO");
            if (!updatedOrder) {
                res.status(404).json({ error: "Pedido não encontrado" });
                return;
            }
            res.json({ order: updatedOrder });
        } catch (error) {
            console.error("Erro ao arquivar pedido:", error);
            res.status(500).json({ error: "Erro ao arquivar pedido" });
        }
    });

    return router;
};
