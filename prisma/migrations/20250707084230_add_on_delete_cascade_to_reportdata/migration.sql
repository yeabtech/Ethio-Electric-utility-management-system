-- DropForeignKey
ALTER TABLE "ReportData" DROP CONSTRAINT "ReportData_reportId_fkey";

-- AddForeignKey
ALTER TABLE "ReportData" ADD CONSTRAINT "ReportData_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
