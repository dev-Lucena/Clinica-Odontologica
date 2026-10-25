import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { criarApp } from '../src/app.js'

// Banco "de mentira": testa as regras sem precisar de PostgreSQL
function bancoFalso({ ocupado = false } = {}) {
    const chamadas = { create: 0 }
    return {
        chamadas,
        tratamento: { findMany: async () => [{ id: 1, nome: 'Limpeza e prevenção' }] },
        paciente: { upsert: async () => ({ id: 1 }) },
        consulta: {
            findMany: async () => [], count: async () => 0,
            create: async ({ data }) => {
                chamadas.create++
                if (ocupado) throw Object.assign(new Error('duplicado'), { code: 'P2002' })
                return { id: 1, inicio: data.inicio, tratamento: { nome: 'Limpeza e prevenção' } }
            }
        }
    }
}

async function iniciar(banco = bancoFalso()) {
    const srv = criarApp(banco, { origens: ['http://localhost:5500'] }).listen(0)
    await once(srv, 'listening')
    return { url: `http://localhost:${srv.address().port}`, fechar: () => srv.close() }
}

function proximaTerca() {
    const d = new Date(); d.setDate(d.getDate() + 7)
    while (d.getDay() !== 2) d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('en-CA')
}

const valido = () => ({ nome: 'Ana Souza', telefone: '(62) 91234-5678', tratamentoId: 1, data: proximaTerca(), hora: '09:00', consentimento: true })
const enviar = (url, corpo, extra = {}) => fetch(`${url}/api/consultas`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo), ...extra
})

test('cabeçalhos de segurança e health', async () => {
    const s = await iniciar(); const r = await fetch(`${s.url}/health`)
    assert.equal(r.status, 200); assert.equal(r.headers.get('x-content-type-options'), 'nosniff'); s.fechar()
})

test('CORS só libera o site autorizado', async () => {
    const s = await iniciar()
    const bom = await fetch(`${s.url}/api/tratamentos`, { headers: { Origin: 'http://localhost:5500' } })
    const ruim = await fetch(`${s.url}/api/tratamentos`, { headers: { Origin: 'https://site-malicioso.com' } })
    assert.equal(bom.headers.get('access-control-allow-origin'), 'http://localhost:5500')
    assert.equal(ruim.headers.get('access-control-allow-origin'), null); s.fechar()
})

test('agendamento válido retorna 201', async () => {
    const s = await iniciar(); const r = await enviar(s.url, valido())
    assert.equal(r.status, 201); s.fechar()
})

test('sem consentimento retorna 400', async () => {
    const s = await iniciar(); const r = await enviar(s.url, { ...valido(), consentimento: false })
    assert.equal(r.status, 400); s.fechar()
})

test('isca de robô não grava nada', async () => {
    const banco = bancoFalso(); const s = await iniciar(banco)
    await enviar(s.url, { ...valido(), site: 'http://spam.com' })
    assert.equal(banco.chamadas.create, 0); s.fechar()
})

test('horário ocupado retorna 409', async () => {
    const s = await iniciar(bancoFalso({ ocupado: true })); const r = await enviar(s.url, valido())
    assert.equal(r.status, 409); s.fechar()
})

test('dados inválidos retornam 400', async () => {
    const s = await iniciar()
    for (const ruim of [{ ...valido(), telefone: '123' }, { ...valido(), tratamentoId: 'abc' }, { ...valido(), hora: '03:00' }, { ...valido(), data: '2020-01-07' }]) {
        assert.equal((await enviar(s.url, ruim)).status, 400)
    }
    s.fechar()
})

test('JSON quebrado retorna 400 sem vazar detalhes', async () => {
    const s = await iniciar(); const r = await enviar(s.url, '{quebrado'); const texto = await r.text()
    assert.equal(r.status, 400); assert.ok(!texto.includes('at ')); s.fechar()
})
