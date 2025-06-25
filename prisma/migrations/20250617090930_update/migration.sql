/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `Receipt` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[txRef]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_approvedById_fkey";

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
ADD COLUMN     "chapaRawResponse" JSONB,
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "txRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_txRef_key" ON "Receipt"("txRef");
