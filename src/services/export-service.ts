import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";

export async function exportValidRecordsCsv(uploadId: string, ownerId: string) {
  const upload = await prisma.upload.findFirst({
    where: {
      id: uploadId,
      source: { ownerId }
    },
    include: {
      schemaVersion: {
        include: {
          columns: {
            orderBy: { position: "asc" }
          }
        }
      },
      validRecords: {
        orderBy: { rowNumber: "asc" }
      }
    }
  });

  if (!upload) {
    throw new AppError("Upload introuvable.", 404);
  }

  const headers = upload.schemaVersion.columns.map((column) => column.name);
  const lines = [headers.join(",")];

  for (const record of upload.validRecords) {
    const data = record.data as Record<string, unknown>;
    lines.push(headers.map((header) => escapeCsv(data[header])).join(","));
  }

  return {
    fileName: upload.originalFileName.replace(/\.[^.]+$/, "") + "-valid.csv",
    csv: lines.join("\n")
  };
}

function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}
