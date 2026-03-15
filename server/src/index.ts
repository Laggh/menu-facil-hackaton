// Funcionalidade principal
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './dbHelpers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inicialização do dotenv para usar variáveis de ambiente (estão no arquivo .env)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Constantes
const PORT = process.env.PORT || 3000

// Inicialização do servidor
const app = express()

// Configuração do servidor
app.use(bodyParser.json()) // Faz o parse do body das requisições para JSON
app.use(cors()) // Permite requisições de outros domínios (CORS)

// Printa no console o IP, método e URL de cada requisição
app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection?.remoteAddress
  const method = req.method
  const url = req.url

  console.log(`${ip} ${method}: ${url}`)

  next()
})

// ========== ROTAS ==========
// IMPORT DAS ROTAS
import aiRoutes from './user/aiRoutes'
import productRoutes from './user/productRoutes'
import orderRoutes from './user/orderRoutes'
import uploadRoute from './uploadRoute'

// USO DAS ROTAS
app.use('/api/ia/', aiRoutes()) // Rota para funcionalidades de IA
app.use('/api/products/', productRoutes()) // Rota para funcionalidades de produtos
app.use('/api/orders/', orderRoutes()) // Rota para pedidos
app.use('/api/upload', uploadRoute()) // Rota para upload de imagens

app.get("/db", async (req: Request, res: Response) => {
    try {
        await db.set("test_key", "Hello, Redis!")
        const value = await db.get("test_key")
        res.json({ value })
    }
    catch (error) {
        console.error("Erro ao acessar o banco de dados:", error)
        res.status(500).json({ error: "Erro ao acessar o banco de dados" })
    } 
})

// Rota de ping
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'Pong!' })
})

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Bem-vindo à API Menu Fácil!' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🍔 Servidor rodando na porta ${PORT}`)
})