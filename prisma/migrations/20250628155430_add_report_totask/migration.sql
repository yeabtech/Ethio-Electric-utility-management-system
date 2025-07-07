/*
  Warnings:

  - You are about to drop the column `report` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reportId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "report",
ADD COLUMN     "reportId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_reportId_key" ON "Task"("reportId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
