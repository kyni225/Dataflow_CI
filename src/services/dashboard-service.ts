import { subDays, startOfDay } from "@/services/date-utils";
import { prisma } from "@/lib/db/prisma";

export async function getDashboard(ownerId: string) {
  const since = subDays(new Date(), 30);
  const uploads = await prisma.upload.findMany({
    where: {
      source: { ownerId },
      createdAt: { gte: since }
    },
    include: {
      source: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  const bySource = new Map<string, { sourceId: string; name: string; files: number; rows: number }>();
  const byDay = new Map<string, { date: string; files: number; validRows: number; invalidRows: number }>();

  for (const upload of uploads) {
    const sourceStats =
      bySource.get(upload.sourceId) ??
      {
        sourceId: upload.sourceId,
        name: upload.source.name,
        files: 0,
        rows: 0
      };
    sourceStats.files += 1;
    sourceStats.rows += upload.rowCount;
    bySource.set(upload.sourceId, sourceStats);

    const date = startOfDay(upload.createdAt).toISOString().slice(0, 10);
    const dayStats =
      byDay.get(date) ??
      {
        date,
        files: 0,
        validRows: 0,
        invalidRows: 0
      };
    dayStats.files += 1;
    dayStats.validRows += upload.validRows;
    dayStats.invalidRows += upload.invalidRows;
    byDay.set(date, dayStats);
  }

  const totalFiles = uploads.length;
  const successfulFiles = uploads.filter((upload) => upload.status === "SUCCESS").length;
  const failedFiles = uploads.filter((upload) => upload.status === "FAILED").length;
  const partialFiles = uploads.filter((upload) => upload.status === "PARTIAL").length;
  const totalRows = uploads.reduce((sum, upload) => sum + upload.rowCount, 0);
  const invalidRows = uploads.reduce((sum, upload) => sum + upload.invalidRows, 0);

  return {
    periodDays: 30,
    totals: {
      totalFiles,
      totalRows,
      successfulFiles,
      partialFiles,
      failedFiles,
      successRate: totalFiles === 0 ? 0 : successfulFiles / totalFiles,
      errorRate: totalRows === 0 ? 0 : invalidRows / totalRows
    },
    filesBySource: Array.from(bySource.values()).sort((a, b) => b.files - a.files),
    volumeByDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
    statusBreakdown: [
      { name: "Success", value: successfulFiles },
      { name: "Partial", value: partialFiles },
      { name: "Failed", value: failedFiles },
      {
        name: "Pending",
        value: uploads.filter((upload) => ["PENDING", "PROCESSING"].includes(upload.status)).length
      }
    ],
    recentUploads: uploads.slice(-8).reverse()
  };
}
