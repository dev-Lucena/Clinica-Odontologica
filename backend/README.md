# API Seu Sorriso Importa

Requisitos: Node 20+ e PostgreSQL (local ou gratuito no neon.tech).

## Rodar local
```bash
cd backend
npm install                 # já roda o prisma generate
cp .env.example .env        # edite DATABASE_URL
npm run migrate             # cria as tabelas (a pasta prisma/migrations já está pronta)
npm run seed                # cadastra os tratamentos
npm run dev                 # http://localhost:3000
npm test                    # testes das regras, sem precisar do banco
```

## Deploy da API (Render ou Railway)
- Root directory: `backend`
- Build: `npm install && npm run migrate && npm run seed:prod`
- Start: `npm start`
- Variáveis:
  - `DATABASE_URL`: connection string do Neon (a que termina com `?sslmode=require`)
  - `CORS_ORIGIN`: endereço do site na Vercel, **sem barra no final** (ex.: `https://clinica-sorriso.vercel.app`)
  - `NODE_ENV=production`
- O seed pode rodar a cada deploy: ele só cadastra os tratamentos que ainda não existem.
- Teste: abra `https://SUA-API.onrender.com/health` (deve mostrar `{"ok":true}`) e depois `/api/tratamentos`.
