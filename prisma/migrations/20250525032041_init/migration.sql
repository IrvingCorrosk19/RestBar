/*
  Warnings:

  - The values [AVAILABLE,OCCUPIED,RESERVED,MAINTENANCE] on the enum `TableStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TableStatus_new" AS ENUM ('LIBRE', 'OCUPADA', 'EN_PEDIDO', 'EN_CUENTA', 'CERRADA');
ALTER TABLE "Table" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Table" ALTER COLUMN "status" TYPE "TableStatus_new" USING ("status"::text::"TableStatus_new");
ALTER TYPE "TableStatus" RENAME TO "TableStatus_old";
ALTER TYPE "TableStatus_new" RENAME TO "TableStatus";
DROP TYPE "TableStatus_old";
ALTER TABLE "Table" ALTER COLUMN "status" SET DEFAULT 'LIBRE';
COMMIT;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "cuentaAbierta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "horaInicio" TIMESTAMP(3),
ADD COLUMN     "usuarioId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'LIBRE';

-- CreateIndex
CREATE INDEX "Table_status_idx" ON "Table"("status");

-- CreateIndex
CREATE INDEX "Table_usuarioId_idx" ON "Table"("usuarioId");

-- CreateIndex
CREATE INDEX "Table_zoneId_idx" ON "Table"("zoneId");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
