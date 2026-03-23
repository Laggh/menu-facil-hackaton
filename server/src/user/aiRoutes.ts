import { GoogleGenAI } from "@google/genai";
import express from "express";
import type { Request, Response } from "express";

import ai from "../aiHelpers.js";
import db from "../dbHelpers.js";
import { Usuario, Produto, PedidoProduto } from "@shared/types";
import { getAiQuotaState } from "../aiQuotaState.js";

export default () => {
    const genAi = new GoogleGenAI({});
    const router = express.Router();

    // Rota de teste
    router.get("/", async (req: Request, res: Response) => {
        const hasApiKey = !!process.env.GOOGLE_API_KEY || !!process.env.GEMINI_API_KEY;
        const quotaState = getAiQuotaState();
        res.json({ 
            message: "Rota de IA funcionando!",
            //apiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
            apiKeyConfigured: hasApiKey,
            ...quotaState,
        });
    });

    // Rota para obter recomendações personalizadas para o usuário
    router.get("/recommendations", async (req: Request, res: Response) => {
        const userId = req.headers["x-user-id"] as string | undefined;

        try {
            // Buscam todos os produtos disponíveis
            const produtos = (await db.get("products")) as Produto[] | null;
            
            if (!produtos || produtos.length === 0) {
                res.json({ recommendations: [] });
                return;
            }

            let usuario: Usuario;

            // Se tiver ID, busca o usuário real
            if (userId) {
                const usuarioReal = await db.user.getById(userId);
                if (usuarioReal) {
                    usuario = usuarioReal;
                } else {
                    // Se não encontrar, usa mock
                    usuario = {
                        id: "anonymous",
                        nome: "usuario sem login",
                        email: "anonymous@user.local",
                        idade: 18
                    };
                }
            } else {
                // Sem autenticação, usa mock
                usuario = {
                    id: "anonymous",
                    nome: "usuario sem login",
                    email: "anonymous@user.local",
                    idade: 18
                };
            }

            // Obter recomendações com IA
            const resultado = await ai.getAIRecommendations(usuario, produtos);
            
            res.json({ 
                recommendations: resultado.data || [],
                error: resultado.error || null
            });

        } catch (error: any) {
            console.error("Erro ao obter recomendações:", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao obter recomendações" });
        }
    });

    // Rota para obter sugestões de produtos baseado no carrinho
    router.post("/suggest-from-cart", async (req: Request, res: Response) => {
        const { cart } = req.body;
        const userId = req.headers["x-user-id"] as string | undefined;

        if (!Array.isArray(cart)) {
            res.status(400).json({ error: "O campo 'cart' é obrigatório e deve ser um array de PedidoProduto" });
            return;
        }

        try {
            // Buscam todos os produtos disponíveis
            const produtos = (await db.get("products")) as Produto[] | null;
            
            if (!produtos || produtos.length === 0) {
                res.json({ suggestions: [] });
                return;
            }

            let usuario: Usuario;

            // Se tiver ID, busca o usuário real
            if (userId) {
                const usuarioReal = await db.user.getById(userId);
                if (usuarioReal) {
                    usuario = usuarioReal;
                } else {
                    // Se não encontrar, usa mock
                    usuario = {
                        id: "anonymous",
                        nome: "usuario sem login",
                        email: "anonymous@user.local",
                        idade: 18
                    };
                }
            } else {
                // Sem autenticação, usa mock
                usuario = {
                    id: "anonymous",
                    nome: "usuario sem login",
                    email: "anonymous@user.local",
                    idade: 18
                };
            }

            // Obter sugestões com IA
            const resultado = await ai.suggestProductsFromCart(cart as PedidoProduto[], usuario, produtos);
            
            res.json({ 
                suggestions: resultado.data || [],
                error: resultado.error || null
            });

        } catch (error: any) {
            console.error("Erro ao sugerir produtos do carrinho:", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao sugerir produtos" });
        }
    });

    return router;
};
