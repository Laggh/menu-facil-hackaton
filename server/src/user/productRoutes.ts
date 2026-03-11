import { GoogleGenAI } from "@google/genai";
import express from "express";
import type { Request, Response } from "express";

import db from "../dbHelpers";

export default () => {
    const genAi = new GoogleGenAI({});
    const router = express.Router();

    router.get("/", async (req: Request, res: Response) => {
        
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
