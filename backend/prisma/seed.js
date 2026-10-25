import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const tratamentos = [
    'Avaliação inicial', 'Limpeza e prevenção', 'Clareamento dental',
    'Lentes de contato dental', 'Aparelho ortodôntico', 'Implantes', 'Odontopediatria'
]

for (const nome of tratamentos) {
    await prisma.tratamento.upsert({ where: { nome }, update: {}, create: { nome } })
}
console.log('Tratamentos cadastrados.')
await prisma.$disconnect()
