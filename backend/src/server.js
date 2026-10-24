import { PrismaClient } from '@prisma/client'
import { criarApp } from './app.js'

// Só liga o servidor. As regras ficam em app.js (e são testadas em test/api.test.js)
const origens = (process.env.CORS_ORIGIN ?? 'http://127.0.0.1:5500,http://localhost:5500')
    .split(',').map(o => o.trim())

const PORTA = process.env.PORT || 3000
criarApp(new PrismaClient(), { origens }).listen(PORTA, () => console.log(`API rodando na porta ${PORTA}`))
