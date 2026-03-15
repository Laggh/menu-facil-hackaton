import { GoogleGenAI } from "@google/genai";
import express from "express";
import type { Request, Response } from "express";

import ai from "../aiHelpers";

export default () => {
    const genAi = new GoogleGenAI({});
    const router = express.Router();

    // Rota de teste
    router.get("/", async (req: Request, res: Response) => {
        const hasApiKey = !!process.env.GOOGLE_API_KEY || !!process.env.GEMINI_API_KEY;
        res.json({ 
            message: "Rota de IA funcionando!",
            apiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY,
            apiKeyConfigured: hasApiKey
        });
    });

    // Rota GET para teste (simples, sem IA)
    router.get("/generate", async (req: Request, res: Response) => {
        const prompt = req.query.prompt as string || "Escreva um poema curto sobre comida";
        const generated = await ai.generate(prompt);

        res.json({ generated });
    });

    return router;
};
