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
   - Build: `npm install && npm run migrate && npm run seed:prod`  |  Start: `npm start`
   - Variáveis: `DATABASE_URL` e `CORS_ORIGIN` (endereço do site, ex.: https://clinica.vercel.app)
   - O seed já roda no build e é seguro repetir (só cadastra o que falta).
3. Ponha a URL da API em `cliente.json` (`apiUrl`), rode `node personalizar.mjs`.
4. **Site (Vercel):** crie um projeto novo com o conteúdo de `entrega/` (Root Directory em branco). Não importe a pasta `backend/` no Vercel.
5. Volte no Render e ponha o endereço que o Vercel gerou em `CORS_ORIGIN`.
6. Confirme `git status` sem nenhum `.env` antes de cada commit.

## Antes de vender (publicidade odontológica)
O Código de Ética Odontológica (CFO) restringe anunciar preços, serviços gratuitos e formas de
pagamento, além de promessa de resultado. O texto do modelo já evita isso. O CFO atualizou o
código em 2025, então confirme as regras vigentes com o CRO do estado do cliente. Use só
depoimentos e fotos reais e autorizados, e mantenha nome e CRO dos profissionais visíveis.

## Ainda não existe
Painel da recepção com login (ver/confirmar/cancelar consultas) e aviso automático por e-mail/WhatsApp.
