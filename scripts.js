// Menu no celular
const menuBtn = document.querySelector('.menu-btn')
const menu = document.querySelector('#menu')

menuBtn.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto')
    menuBtn.setAttribute('aria-expanded', aberto)
})
menu.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => {
        menu.classList.remove('aberto')
        menuBtn.setAttribute('aria-expanded', false)
    })
)

// ---------- Agendamento (conectado à API) ----------
// Troque a URL de produção pelo endereço da sua API depois do deploy
const API = ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:3000/api'
    : 'https://clinica-sorriso-api.onrender.com/api'
const WHATSAPP = 'https://wa.me/5562999999999'

const form = document.querySelector('#form-agendamento')
const retorno = document.querySelector('#retorno')

// data mínima = hoje (horário local) e máxima = 90 dias
const dataLocal = (dias = 0) => new Date(Date.now() + dias * 864e5).toLocaleDateString('en-CA')
form.data.min = dataLocal()
form.data.max = dataLocal(90)

function avisar(texto, comZap = false) {
    retorno.textContent = texto
    if (comZap) {
        const link = document.createElement('a')
        link.href = WHATSAPP
        link.textContent = 'Falar no WhatsApp'
        link.target = '_blank'
        link.rel = 'noopener'
        retorno.append(link)
    }
}

async function carregarTratamentos() {
    try {
        const resposta = await fetch(`${API}/tratamentos`)
        if (!resposta.ok) throw new Error()
        const lista = await resposta.json()
        form.tratamentoId.replaceChildren(
            new Option('Escolha uma opção', ''),
            ...lista.map(t => new Option(t.nome, t.id))
        )
    } catch {
        form.tratamentoId.replaceChildren(new Option('Indisponível no momento', ''))
        avisar('O agendamento online está fora do ar.', true)
    }
}

async function carregarHorarios() {
    if (!form.data.value) return
    form.hora.disabled = true
    form.hora.replaceChildren(new Option('Buscando horários...', ''))
    try {
        const resposta = await fetch(`${API}/horarios?data=${encodeURIComponent(form.data.value)}`)
        if (!resposta.ok) throw new Error()
        const { horarios } = await resposta.json()
        form.hora.replaceChildren(
            ...(horarios.length
                ? [new Option('Escolha', ''), ...horarios.map(h => new Option(h, h))]
                : [new Option('Sem horários neste dia', '')])
        )
        form.hora.disabled = !horarios.length
    } catch {
        form.hora.replaceChildren(new Option('Erro ao buscar', ''))
    }
}

form.data.addEventListener('change', carregarHorarios)

form.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    avisar('')
    let valido = true

    form.querySelectorAll('input:not([type=checkbox]):not([name=site]), select').forEach(campo => {
        const vazio = !campo.value.trim()
        campo.classList.toggle('erro', vazio)
        if (vazio) valido = false
    })
    if (!valido || !form.aceite.checked) {
        avisar(valido ? 'Marque a caixa de concordância para continuar.' : 'Preencha todos os campos para pedir o horário.')
        return
    }

    const dados = { ...Object.fromEntries(new FormData(form)), consentimento: true }
    delete dados.aceite
    avisar('Enviando...')
    try {
        const resposta = await fetch(`${API}/consultas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        })
        const corpo = await resposta.json().catch(() => ({}))

        if (!resposta.ok) {
            avisar(corpo.erro || 'Não foi possível agendar.')
            if (resposta.status === 409) carregarHorarios()
            return
        }
        const [ano, mes, dia] = dados.data.split('-')
        avisar(`Pedido recebido para ${dia}/${mes}/${ano} às ${dados.hora}. Confirmamos pelo WhatsApp.`)
        form.reset()
        form.hora.replaceChildren(new Option('Escolha o dia', ''))
        form.hora.disabled = true
    } catch {
        avisar('Sem conexão com o servidor.', true)
    }
})

carregarTratamentos()
