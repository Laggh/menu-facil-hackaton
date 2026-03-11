import express from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import db from "../dbHelpers";

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

    });

    router.put("/:id", async (req: Request, res: Response) => {

    });

    router.delete("/:id", async (req: Request, res: Response) => {

    });

    router.get("/:id", async (req: Request, res: Response) => {

    });
    return router;
};
