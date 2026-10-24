import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// ---------- Regras da clínica ----------
// Segunda a sexta: manhã e tarde. Sábado: só manhã. Domingo: fechado.
export function horariosDoDia(data) {
    const diaSemana = new Date(`${data}T12:00:00-03:00`).getUTCDay() // 0 = domingo
    const manha = ['08:00', '09:00', '10:00', '11:00']
    const tarde = ['14:00', '15:00', '16:00', '17:00']
    if (diaSemana === 0) return []
    return diaSemana === 6 ? manha : [...manha, ...tarde]
}

const JANELA_DIAS = 90 // só dá para marcar até 90 dias à frente
const MAX_CONSULTAS_FUTURAS = 2 // por telefone
const dataValida = (d) => {
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
    const [a, m, dia] = d.split('-').map(Number)
    const t = new Date(Date.UTC(a, m - 1, dia))
    return t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === dia // rejeita 31/02
}
const inicioDe = (data, hora) => new Date(`${data}T${hora}:00-03:00`) // horário de Brasília
const dentroDaJanela = (t) => t > Date.now() && t <= Date.now() + JANELA_DIAS * 86400000

export function criarApp(prisma, { origens = [] } = {}) {
    const app = express()
    app.set('trust proxy', 1) // atrás do Render/Railway, para o limite por IP funcionar
    app.use(helmet())         // cabeçalhos de segurança
    app.use(cors({ origin: origens, methods: ['GET', 'POST'] })) // só os sites da lista
    app.use(express.json({ limit: '10kb' }))
    app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }))
    const limiteAgendar = rateLimit({
        windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
        message: { erro: 'Muitas tentativas. Tente novamente mais tarde.' }
    })

    app.get('/health', (req, res) => res.json({ ok: true }))

    app.get('/api/tratamentos', async (req, res) => {
        res.json(await prisma.tratamento.findMany({ orderBy: { id: 'asc' } }))
    })

    app.get('/api/horarios', async (req, res) => {
        const { data } = req.query
        if (!dataValida(data)) return res.status(400).json({ erro: 'Data inválida. Use AAAA-MM-DD.' })

        const ocupadas = await prisma.consulta.findMany({
            where: { inicio: { gte: inicioDe(data, '00:00'), lte: inicioDe(data, '23:59') } },
            select: { inicio: true }
        })
        const ocupados = new Set(ocupadas.map(c => c.inicio.getTime()))
        const horarios = horariosDoDia(data).filter(h => {
            const t = inicioDe(data, h).getTime()
            return dentroDaJanela(t) && !ocupados.has(t)
        })
        res.json({ data, horarios })
    })

    app.post('/api/consultas', limiteAgendar, async (req, res) => {
        const { nome, telefone, tratamentoId, data, hora, consentimento, site } = req.body ?? {}

        if (site) return res.status(201).json({ ok: true }) // isca para robôs: finge sucesso e não grava nada

        const nomeLimpo = String(nome ?? '').trim()
        const tel = String(telefone ?? '').replace(/\D/g, '')
        const idTratamento = Number(tratamentoId)

        if (nomeLimpo.length < 2 || nomeLimpo.length > 100) return res.status(400).json({ erro: 'Informe o seu nome.' })
        if (tel.length < 10 || tel.length > 11) return res.status(400).json({ erro: 'WhatsApp inválido. Use DDD + número.' })
        if (!Number.isInteger(idTratamento) || idTratamento < 1) return res.status(400).json({ erro: 'Escolha um tratamento.' })
        if (consentimento !== true) return res.status(400).json({ erro: 'É preciso aceitar o uso dos dados para agendar.' })
        if (!dataValida(data) || !horariosDoDia(data).includes(hora)) return res.status(400).json({ erro: 'Horário inválido.' })

        const inicio = inicioDe(data, hora)
        if (!dentroDaJanela(inicio.getTime())) return res.status(400).json({ erro: 'Escolha um horário nos próximos 90 dias.' })

        try {
            // update vazio de propósito: quem digita o telefone de outra pessoa não pode trocar o nome dela
            const paciente = await prisma.paciente.upsert({
                where: { telefone: tel }, update: { consentimentoEm: new Date() }, create: { nome: nomeLimpo, telefone: tel, consentimentoEm: new Date() }
            })
            const futuras = await prisma.consulta.count({ where: { pacienteId: paciente.id, inicio: { gt: new Date() } } })
            if (futuras >= MAX_CONSULTAS_FUTURAS) {
                return res.status(400).json({ erro: 'Você já tem 2 consultas agendadas. Fale com a clínica para marcar mais.' })
            }
            const consulta = await prisma.consulta.create({
                data: { inicio, pacienteId: paciente.id, tratamentoId: idTratamento },
                include: { tratamento: true }
            })
            res.status(201).json({ id: consulta.id, inicio: consulta.inicio, tratamento: consulta.tratamento.nome })
        } catch (e) {
            if (e.code === 'P2002') return res.status(409).json({ erro: 'Esse horário acabou de ser ocupado. Escolha outro.' })
            if (e.code === 'P2003') return res.status(400).json({ erro: 'Tratamento inválido.' })
            console.error('Erro ao agendar:', e.name, e.code) // sem logar dados do paciente
            res.status(500).json({ erro: 'Erro no servidor. Tente de novo em instantes.' })
        }
    })

    app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }))

    // Último guarda: nunca devolve detalhes técnicos para quem está de fora
    app.use((err, req, res, next) => {
        if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
            return res.status(400).json({ erro: 'Requisição inválida.' })
        }
        console.error('Erro inesperado:', err.name)
        res.status(500).json({ erro: 'Erro no servidor.' })
    })

    return app
}
