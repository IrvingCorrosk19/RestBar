-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('KITCHEN', 'BAR');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "type" "OrderType" NOT NULL DEFAULT 'KITCHEN';
