import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { UsuarioSchema, Usuario } from "@shared/types";
import db from "../dbHelpers.js";

// Middleware para extrair ID do header
const getUserIdFromHeader = (req: Request): string | null => {
    const userId = req.headers["x-user-id"] as string | undefined;
    return userId || null;
};

export default () => {
    const router = express.Router();

    // GET /api/user - Listar todos os usuários
    router.get("/", async (req: Request, res: Response) => {
        try {
            // Busca todas as chaves que começam com "user:" (exceto as de email)
            const keys = await db.redis.keys("user:*") as string[];
            const userKeys = keys.filter(k => !k.startsWith("user:email:"));
            
            if (userKeys.length === 0) {
                res.json({ users: [] });
                return;
            }

            // Busca todos os usuários em paralelo
            const users = await Promise.all(
                userKeys.map(key => db.redis.get(key) as Promise<Usuario>)
            );

            res.json({ users: users.filter(u => u !== null) });
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            res.status(500).json({ error: "Erro ao listar usuários" });
        }
    });

    // GET /api/user/me - Ver dados do usuário
    router.get("/me", async (req: Request, res: Response) => {
        const userId = getUserIdFromHeader(req);
        
        if (!userId) {
            res.status(401).json({ error: "x-user-id header é obrigatório" });
            return;
        }

        try {
            const user = await db.user.getById(userId);
            if (!user) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
            res.json({ user });
        } catch (error) {
            console.error("Erro ao buscar usuário:", error);
            res.status(500).json({ error: "Erro ao buscar usuário" });
        }
    });

    // POST /api/user/register - Registrar novo usuário
    router.post("/register", async (req: Request, res: Response) => {
        const { nome, email, idade } = req.body;

        if (!nome || !email || !idade) {
            res.status(400).json({ error: "Nome, email e idade são obrigatórios" });
            return;
        }

        if (typeof nome !== 'string' || typeof email !== 'string' || typeof idade !== 'number') {
            res.status(400).json({ error: "Tipos de dados inválidos" });
            return;
        }

        try {
            // Verifica se email já existe
            const existingUser = await db.user.getByEmail(email);
            if (existingUser) {
                res.status(409).json({ error: "Email já registrado" });
                return;
            }

            const newUser = await db.user.create({
                nome,
                email,
                idade,
            });

            res.status(201).json({ user: newUser });
        } catch (error) {
            console.error("Erro ao registrar usuário:", error);
            res.status(500).json({ error: "Erro ao registrar usuário" });
        }
    });

    // POST /api/user/login - Login
    router.post("/login", async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: "Email é obrigatório" });
            return;
        }

        try {
            const user = await db.user.getByEmail(email);
            if (!user) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }

            res.json({ user, token: user.id }); // Retorna o ID como "token"
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            res.status(500).json({ error: "Erro ao fazer login" });
        }
    });

    // PUT /api/user/edit - Editar dados do usuário
    router.put("/edit", async (req: Request, res: Response) => {
        const userId = getUserIdFromHeader(req);
        
        if (!userId) {
            res.status(401).json({ error: "x-user-id header é obrigatório" });
            return;
        }

        const { nome, email, idade, etiqueta } = req.body;

        const updateData: any = {};
        if (nome !== undefined) updateData.nome = nome;
        if (email !== undefined) updateData.email = email;
        if (idade !== undefined) updateData.idade = idade;
        if (etiqueta !== undefined) updateData.etiqueta = etiqueta;

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ error: "Nenhum campo para atualizar" });
            return;
        }

        try {
            const updatedUser = await db.user.update(userId, updateData);
            if (!updatedUser) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
            res.json({ user: updatedUser });
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            res.status(500).json({ error: "Erro ao atualizar usuário" });
        }
    });

    return router;
};
