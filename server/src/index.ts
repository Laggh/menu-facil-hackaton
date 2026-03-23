// Funcionalidade principal
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './dbHelpers.js'

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

// Modo demonstração: bloqueia operações que alteram estado no servidor.
// Mantém apenas alguns POSTs técnicos permitidos para fluxo de IA/upload.
const BLOCKED_WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])
const ALLOWED_DEMO_POST_PATHS = new Set([
  "/api/products/generate-description",
  "/api/products/suggest",
  "/api/ia/suggest-from-cart",
  "/api/upload",
  "/api/user/login",
])

app.use((req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase()

  if (!BLOCKED_WRITE_METHODS.has(method)) {
    next()
    return
  }

  if (method === "POST" && ALLOWED_DEMO_POST_PATHS.has(req.path)) {
    next()
    return
  }

  res.status(403).json({
    error: "Funcionalidade indisponível nesta demonstração para preservar o estado atual",
  })
})

// ========== ROTAS ==========
// IMPORT DAS ROTAS
import aiRoutes from './user/aiRoutes.js'
import userRoutes from './user/userRoutes.js'
import productRoutes from './user/productRoutes.js'
import orderRoutes from './user/orderRoutes.js'
import logRoutes from './user/logRoutes.js'
import taskRoutes from './user/taskRoutes.js'
import uploadRoute from './uploadRoute.js'
import { startTaskWorker } from './taskWorker.js'

// USO DAS ROTAS
app.use('/api/ia/', aiRoutes()) // Rota para funcionalidades de IA
app.use('/api/user/', userRoutes()) // Rota para usuários
app.use('/api/products/', productRoutes()) // Rota para funcionalidades de produtos
app.use('/api/orders/', orderRoutes()) // Rota para pedidos
app.use('/api/tasks', taskRoutes()) // Rota para tasks
app.use('/api/log', logRoutes()) // Rota para logs
app.use('/api/upload', uploadRoute()) // Rota para upload de imagens

// Rota de ping
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'Pong!' })
})

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Bem-vindo à API Menu Fácil!' })
})

// Iniciar servidor
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🍔 Servidor rodando na porta ${PORT}`)

    // Iniciar task worker apenas no ambiente servidor tradicional.
    startTaskWorker()
  })
}

export default app