// Uso: edite o cliente.json e rode  node personalizar.mjs
// Gera a pasta "entrega/" pronta para subir. O modelo desta pasta não é alterado.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'

const c = JSON.parse(readFileSync('cliente.json', 'utf8'))
const digitos = String(c.whatsapp).replace(/\D/g, '')

if (!/^55\d{10,11}$/.test(digitos)) console.warn('AVISO: whatsapp deve ter 55 + DDD + número (ex.: 5562999999999).')
if (!/^https:\/\/[^/\s]+$/.test(c.apiUrl) || c.apiUrl.includes('SUA-API')) console.warn('AVISO: apiUrl ainda é o exemplo. O agendamento online ficará fora do ar até você trocar.')
if (c.responsavel.includes('00000')) console.warn('AVISO: informe o CRO real do responsável técnico.')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const trocas = [
    ['Seu Sorriso Importa', c.nome],
    ['Seu sorriso importa.', c.titulo],
    ['5562999999999', digitos],
    ['(62) 99999-9999', c.whatsappFormatado],
    ['contato@seusorrisoimporta.com.br', c.email],
    ['Rua das Acácias, 120, sala 4', c.endereco],
    ['Atendimento de segunda a sexta, das 8h às 18h; sábado, das 8h às 12h', c.horario],
    ['Dra. Helena Duarte, CRO-GO 00000', c.responsavel],
    ['https://SUA-API.onrender.com', c.apiUrl]
]

mkdirSync('entrega', { recursive: true })
for (const arq of ['index.html', 'styles.css', 'scripts.js', 'vercel.json', '.vercelignore', '.gitignore']) {
    if (!existsSync(arq)) continue
    let texto = readFileSync(arq, 'utf8')
    for (const [de, para] of trocas) texto = texto.split(de).join(arq === 'index.html' ? esc(para) : para)
    writeFileSync(`entrega/${arq}`, texto)
}
console.log('Pronto: pasta entrega/ gerada. Suba o conteúdo dela no GitHub/Vercel.')
