# Seu Sorriso Importa — landing page + agendamento

Modelo reutilizável de site para consultório odontológico (front estático + API Node/PostgreSQL).

## Personalizar para um cliente
1. Edite `cliente.json` (nome, WhatsApp, endereço, horário, CRO, URL da API).
2. Em `index.html`, troque a equipe (nomes, especialidades, CRO) e os depoimentos.
3. Rode `node personalizar.mjs`. A pasta `entrega/` sai pronta, e o modelo não é alterado.
4. Horários de atendimento da agenda: função `horariosDoDia` em `backend/src/app.js`.

## Deploy
1. **Banco:** crie um PostgreSQL no neon.tech e copie a connection string.
2. **API (Render ou Railway), pasta `backend/`:**
   - Build: `npm install && npm run migrate`  |  Start: `npm start`
   - Variáveis: `DATABASE_URL` e `CORS_ORIGIN` (endereço do site, ex.: https://clinica.vercel.app)
   - Depois do primeiro deploy, rode uma vez `npm run seed` para cadastrar os tratamentos.
3. Ponha a URL da API em `cliente.json` (`apiUrl`), rode `node personalizar.mjs`.
4. **Site (Vercel):** suba o conteúdo de `entrega/` em um repositório e importe no Vercel.
5. Confirme `git status` sem nenhum `.env` antes de cada commit.

## Antes de vender (publicidade odontológica)
O Código de Ética Odontológica (CFO) restringe anunciar preços, serviços gratuitos e formas de
pagamento, além de promessa de resultado. O texto do modelo já evita isso. O CFO atualizou o
código em 2025, então confirme as regras vigentes com o CRO do estado do cliente. Use só
depoimentos e fotos reais e autorizados, e mantenha nome e CRO dos profissionais visíveis.

## Ainda não existe
Painel da recepção com login (ver/confirmar/cancelar consultas) e aviso automático por e-mail/WhatsApp.
