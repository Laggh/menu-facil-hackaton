import express from "express"
import type { Request, Response } from "express"
import multer from "multer"
import { UTApi } from "uploadthing/server"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Apenas imagens são permitidas"))
            return
        }
        cb(null, true)
    },
})

const utapi = new UTApi({ token: process.env.UPLOADTHING_API_KEY })

export default () => {
    const router = express.Router()

    router.post("/", upload.single("file"), async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ error: "Nenhum arquivo enviado" })
            return
        }

        try {
            const file = new File([req.file.buffer], req.file.originalname, {
                type: req.file.mimetype,
            })

            const result = await utapi.uploadFiles(file)

            if (result.error) {
                console.error("Erro UploadThing:", result.error)
                res.status(500).json({ error: "Erro ao fazer upload da imagem" })
                return
            }

            res.json({ url: result.data.ufsUrl })
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error)
            res.status(500).json({ error: "Erro ao fazer upload da imagem" })
        }
    })

    return router
}
