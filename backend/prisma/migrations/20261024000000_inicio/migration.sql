-- CreateTable
CREATE TABLE "Tratamento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Tratamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentimentoEm" TIMESTAMP(3),

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" SERIAL NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" INTEGER NOT NULL,
    "tratamentoId" INTEGER NOT NULL,

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tratamento_nome_key" ON "Tratamento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_telefone_key" ON "Paciente"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "Consulta_inicio_key" ON "Consulta"("inicio");

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_tratamentoId_fkey" FOREIGN KEY ("tratamentoId") REFERENCES "Tratamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
