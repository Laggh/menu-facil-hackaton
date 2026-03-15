import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { Produto, ProdutoSchema, Restricao, RestricaoArray, Usuario } from "@shared/types";

import db from "../dbHelpers";
import ai from "../aiHelpers";

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

    router.post("/search", async (req: Request, res: Response) => {
        const { query, usuario } = req.body;
        
        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: "O campo 'query' é obrigatório e deve ser uma string" });
            return;
        }

        if (!usuario) {
            res.status(400).json({ error: "O campo 'usuario' é obrigatório" });
            return;
        }

        try {
            // Buscam todos os produtos disponíveis
            const produtos = await db.get("products") as Produto[] | null;
            
            if (!produtos || produtos.length === 0) {
                res.json({ produtos: [] });
                return;
            }

            // Tentam buscar com IA
            try {
                const produtosEncontrados = await ai.searchProductsWithAI(query, usuario, produtos);
                
                if (produtosEncontrados && produtosEncontrados.length > 0) {
                    res.json({ produtos: produtosEncontrados });
                    return;
                }
            } catch (aiError) {
                console.warn("Erro ao buscar com IA, usando busca simples:", aiError);
            }

            // Fallback para busca simples (sem IA)
            const produtosSimples = ai.searchProductsSimple(query, produtos);
            res.json({ produtos: produtosSimples });

        } catch (error: any) {
            console.error("Erro ao buscar produtos:", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao buscar produtos" });
        }
    });

    // GET /busca — Busca semântica inteligente (com fallback)
    // Query params: ?q=termo
    router.get("/busca", async (req: Request, res: Response) => {
        const q = req.query.q;
        
        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: "O parâmetro 'q' é obrigatório e deve ser uma string" });
            return;
        }

        try {
            // Buscar todos os produtos disponíveis
            const produtos = await db.get("products") as Produto[] | null;
            
            if (!produtos || produtos.length === 0) {
                res.json({ products: [] });
                return;
            }

            // Tentar buscar com IA
            try {
                const usuarioMock: Usuario = {
                    id: "1",
                    nome: "Usuário",
                    email: "usuario@unknown.com",
                    idade: 30
                };
                const produtosEncontrados = await ai.searchProductsWithAI(q, usuarioMock, produtos);
                
                if (produtosEncontrados && produtosEncontrados.length > 0) {
                    res.json({ products: produtosEncontrados });
                    return;
                }
            } catch (aiError) {
                console.warn("Erro ao buscar com IA (rota GET), usando busca simples:", aiError);
            }

            // Fallback para busca simples (sem IA)
            const produtosSimples = ai.searchProductsSimple(q, produtos);
            res.json({ products: produtosSimples });

        } catch (error: any) {
            console.error("Erro ao buscar produtos (GET /busca):", error);
            if (error?.status === "UNAVAILABLE" || error?.message?.includes("503")) {
                res.status(503).json({ error: "Serviço de IA temporariamente indisponível, tente novamente em instantes" });
                return;
            }
            res.status(500).json({ error: "Erro ao buscar produtos" });
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
