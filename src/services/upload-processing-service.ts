import type { UploadStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { readUploadFile } from "@/lib/storage/local-file-storage";
import { parseDataFile } from "@/lib/validation/file-parser";
import { toDomainColumn } from "@/lib/validation/schema-mapper";
import { validateRows } from "@/lib/validation/upload-validation";
import { uploadRepository } from "@/repositories/upload-repository";
import type { RowConstraintDefinition } from "@/types/schema";

export async function processUpload(uploadId: string) {
  const startedAt = Date.now();
  await uploadRepository.markProcessing(uploadId);

  try {
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        source: true,
        schemaVersion: {
          include: {
            columns: {
              orderBy: { position: "asc" }
            }
          }
        }
      }
    });

    if (!upload) {
      throw new Error("Upload introuvable.");
    }

    const buffer = await readUploadFile(upload.storagePath);
    const rows = await parseDataFile(buffer, upload.originalFileName, {
      fileFormat: upload.source.fileFormat === "xlsx" ? "xlsx" : "csv",
      delimiter: upload.source.delimiter,
      encoding: upload.source.encoding,
      hasHeader: upload.source.hasHeader
    });
    const summary = validateRows(
      rows,
      upload.schemaVersion.columns.map(toDomainColumn),
      toRowConstraints(upload.source.rowConstraints)
    );
    const status = resolveStatus(summary.rowCount, summary.validRows, summary.invalidRows);

    await uploadRepository.replaceResults({
      uploadId,
      status,
      rowCount: summary.rowCount,
      validRows: summary.validRows,
      invalidRows: summary.invalidRows,
      validRecords: summary.validRecords,
      errors: summary.errors,
      processingDurationMs: Date.now() - startedAt
    });

    await prisma.auditLog.create({
      data: {
        actorId: upload.uploadedById,
        sourceId: upload.sourceId,
        uploadId,
        action: "UPLOAD_PROCESSED",
        entityType: "Upload",
        entityId: uploadId,
        metadata: {
          status,
          rowCount: summary.rowCount,
          validRows: summary.validRows,
          invalidRows: summary.invalidRows
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de traitement inconnue.";
    await uploadRepository.markFailed(uploadId, message, Date.now() - startedAt);
    throw error;
  }
}

function toRowConstraints(value: unknown): RowConstraintDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      typeof item.name === "string"
    ) {
      return [
        {
          name: item.name,
          description:
            "description" in item && typeof item.description === "string" ? item.description : null
        }
      ];
    }

    return [];
  });
}

function resolveStatus(rowCount: number, validRows: number, invalidRows: number): UploadStatus {
  if (rowCount === 0 || validRows === 0) {
    return "FAILED";
  }

  if (invalidRows > 0) {
    return "PARTIAL";
  }

  return "SUCCESS";
}
