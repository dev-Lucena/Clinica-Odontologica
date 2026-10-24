# API Seu Sorriso Importa

Requisitos: Node 20+ e PostgreSQL (local ou gratuito no neon.tech).

## Rodar local
```bash
cd backend
npm install   # já roda o prisma generate
cp .env.example .env                    # edite DATABASE_URL
npx prisma migrate dev --name inicio    # cria as tabelas (suba a pasta prisma/migrations no Git)
npm run seed                            # cadastra os tratamentos
npm run dev                             # http://localhost:3000
npm test                                # testes das regras, sem precisar do banco
```

## Deploy (API no Render ou Railway)
- Root directory: `backend`
- Build: `npm install && npx prisma migrate deploy`
- Start: `npm start`
- Variáveis: `DATABASE_URL`, `ALLOWED_ORIGINS` (URL do site na Vercel), `NODE_ENV=production`
- Rode o seed uma vez (shell do serviço ou local apontando para o banco de produção)
