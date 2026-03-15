import express from "express";
import type { Request, Response } from "express";

import db from "../dbHelpers";

export default () => {
    const router = express.Router();

    router.get("/", async (req: Request, res: Response) => {
        try {
            const logs = await db.get("gemini_log") as string[] | null;
            
            if (!logs || logs.length === 0) {
                res.json({ logs: [] });
                return;
            }

            // Parseia os JSONs armazenados
            const parsedLogs = logs.map((logStr: string) => {
                try {
                    return JSON.parse(logStr);
                } catch {
                    return { raw: logStr };
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
