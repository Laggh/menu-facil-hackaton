import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { Produto, ProdutoSchema, Restricao, RestricaoArray } from "@shared/types";

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

    return router;
};
