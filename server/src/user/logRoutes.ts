import express from "express";
import type { Request, Response } from "express";
import type { GeminiLog } from "@shared/types";

import db from "../dbHelpers.js";

export default () => {
    const router = express.Router();

    router.get("/", async (req: Request, res: Response) => {
        try {
            const logs = await db.redis.lrange("gemini_log", 0, -1) as string[];

            if (!logs || logs.length === 0) {
                res.json({ logs: [] });
                return;
            }

            // Parseia os JSONs armazenados (Upstash redis geralmente já retorna o objeto parseado)
            const parsedLogs: (GeminiLog | { raw: string })[] = logs.map((logItem: any) => {
                try {
                    if (typeof logItem === 'object' && logItem !== null) return logItem;
                    return JSON.parse(logItem);
                } catch {
                    return { raw: logItem };
                }
            });

            res.json({ logs: parsedLogs });
        } catch (error) {
            console.error("Erro ao acessar logs:", error);
            res.status(500).json({ error: "Erro ao acessar logs" });
        }
    });

    return router;
};
