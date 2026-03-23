import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { Produto, ProdutoSchema, Restricao, RestricaoArray, Usuario, PedidoProduto, PedidoProdutoSchema } from "@shared/types";

import db from "../dbHelpers.js";
import ai from "../aiHelpers.js";

export default () => {
    const router = express.Router();

    router.get("/", async (req: Request, res: Response) => {
        try {
            const products = await db.get("products");
            res.json({ products: products });
        } catch (error) {
            console.error("Erro ao acessar o banco de dados:", error);
            res.status(500).json({ error: "Erro ao acessar o banco de dados" });
        }
    });

    router.post("/", async (req: Request, res: Response) => {
        const parseResult = ProdutoSchema.omit({ id: true }).safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: "Dados inválidos", details: parseResult.error });
            return;
        }

        try {
            const newProduct = await db.product.create(parseResult.data as Omit<Produto, "id">);
            res.status(201).json({ product: newProduct });
        } catch (error) {
            console.error("Erro ao criar produto:", error);
            res.status(500).json({ error: "Erro ao criar produto" });
        }
    });

    router.put("/:id", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);        
        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" });
            return;
        }

        const parseResult = ProdutoSchema.partial().safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: "Dados inválidos", details: parseResult.error });
            return;
        }

        try {
            const updatedProduct = await db.product.update(id, parseResult.data as Partial<Produto>);
            res.json({ product: updatedProduct });
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            res.status(500).json({ error: "Erro ao atualizar produto" });
        }
    });

    router.delete("/:id", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" });
            return;
        }

        try {
            await db.product.delete(id);
            res.json({ message: "Produto excluído com sucesso" });
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            res.status(500).json({ error: "Erro ao excluir produto" });
        }
    });

    router.post("/generate-description", async (req: Request, res: Response) => {
        const { name, definicao } = req.body;
        if (name === undefined) {
            res.status(400).json({ error: "O campo 'name' é obrigatório" });
            return;
        }

        try {
            const data = await ai.generateProductDescription(name, definicao);
            if (!data) {
                res.status(422).json({ error: "Informações insuficientes para gerar descrição" });
                return;
            }
            res.json({ data });
        } catch (error: any) {
            console.error("Erro ao gerar descrição do produto:", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao gerar descrição do produto" });
        }
    });

    // GET /busca — Busca semântica inteligente (com fallback)
    // Query params: ?q=termo
    // Header: x-user-id (opcional)
    router.get("/busca", async (req: Request, res: Response) => {
        const q = req.query.q;
        const userId = req.headers["x-user-id"] as string | undefined;
        
        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: "O parâmetro 'q' é obrigatório e deve ser uma string" });
            return;
        }

        try {
            // Buscar todos os produtos disponíveis
            const produtos = (await db.get("products")) as Produto[] | null;
            
            if (!produtos || produtos.length === 0) {
                res.json({ products: [], error: null });
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

            // Tentar buscar com IA
            const resultadoIA = await ai.searchProductsWithAI(q, usuario, produtos);
            
            if (resultadoIA.data && resultadoIA.data.length > 0) {
                res.json({ products: resultadoIA.data, error: resultadoIA.error || null });
                return;
            }

            // Se a IA retornar vazio ou erro, usar fallback de busca simples
            const produtosSimples = ai.searchProductsSimple(q, produtos);
            res.json({ products: produtosSimples, error: resultadoIA.error || null });

        } catch (error: any) {
            console.error("Erro ao buscar produtos (GET /busca):", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao buscar produtos" });
        }
    });

    // POST /api/products/suggest - Sugerir produtos baseado no carrinho e preferências do usuário
    router.post("/suggest", async (req: Request, res: Response) => {
        const { carrinho } = req.body;
        const userId = req.headers["x-user-id"] as string | undefined;

        if (!Array.isArray(carrinho)) {
            res.status(400).json({ error: "O campo 'carrinho' é obrigatório e deve ser um array de produtos" });
            return;
        }

        // Validar cada item do carrinho com PedidoProdutoSchema
        const validacaoCarrinho = carrinho.map(item => PedidoProdutoSchema.safeParse(item));
        const errosValidacao = validacaoCarrinho.filter(v => !v.success);
        if (errosValidacao.length > 0) {
            res.status(400).json({ error: "Carrinho contém itens inválidos", details: errosValidacao[0].error });
            return;
        }

        if (carrinho.length === 0) {
            res.status(400).json({ error: "Carrinho vazio, não há o que sugerir" });
            return;
        }

        try {
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

            // Buscar todos os produtos disponíveis
            const allProducts = (await db.get("products")) as Produto[] | null;
            
            if (!allProducts || allProducts.length === 0) {
                res.json({ sugestoes: [], error: null });
                return;
            }

            // Gerar sugestões com IA (com fallback automático)
            const resultado = await ai.suggestProductsFromCart(carrinho, usuario, allProducts);
            
            res.json({ 
                sugestoes: resultado.data || [],
                error: resultado.error || null
            });
        } catch (error: any) {
            console.error("Erro ao sugerir produtos:", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao sugerir produtos" });
        }
    });

    // Rota genérica GET /:id deve estar por ÚLTIMO (após todas as rotas específicas)
    router.get("/:id", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "ID inválido" });
            return;
        }

        try {
            const product = await db.product.getById(id);
            if (!product) {
                res.status(404).json({ error: "Produto não encontrado" });
                return;
            }
            res.json({product: product});
        } catch (error) {
            console.error("Erro ao acessar o banco de dados:", error);
            res.status(500).json({ error: "Erro ao acessar o banco de dados" });
        }
    });

    return router;
};
