import type { UploadStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";

export const uploadRepository = {
  async listByOwner(ownerId: string) {
    return prisma.upload.findMany({
      where: {
        source: { ownerId }
      },
      orderBy: { createdAt: "desc" },
      include: {
        source: true,
        schemaVersion: true
      }
    });
  },

  async getForOwner(uploadId: string, ownerId: string) {
    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId,
        source: { ownerId }
      },
      include: {
        source: true,
        schemaVersion: {
          include: {
            columns: {
              orderBy: { position: "asc" }
            }
          }
        },
        errors: {
          orderBy: [{ rowNumber: "asc" }, { columnName: "asc" }]
        },
        validRecords: {
          orderBy: { rowNumber: "asc" },
          take: 25
        }
      }
    });

    if (!upload) {
      throw new AppError("Upload introuvable.", 404);
    }

    return upload;
  },

  async create(input: {
    sourceId: string;
    schemaVersionId: string;
    uploadedById: string;
    originalFileName: string;
    storagePath: string;
    mimeType: string;
    byteSize: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const upload = await tx.upload.create({
        data: {
          sourceId: input.sourceId,
          schemaVersionId: input.schemaVersionId,
          uploadedById: input.uploadedById,
          originalFileName: input.originalFileName,
          storagePath: input.storagePath,
          mimeType: input.mimeType,
          byteSize: input.byteSize
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: input.uploadedById,
          sourceId: input.sourceId,
          uploadId: upload.id,
          action: "UPLOAD_CREATED",
          entityType: "Upload",
          entityId: upload.id
        }
      });

      return upload;
    });
  },

  async markProcessing(uploadId: string) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: "PROCESSING",
        processingStartedAt: new Date(),
        errorMessage: null
      }
    });
  },

  async replaceResults(input: {
    uploadId: string;
    status: UploadStatus;
    rowCount: number;
    validRows: number;
    invalidRows: number;
    processingDurationMs: number;
    validRecords: Array<{ rowNumber: number; data: Record<string, string | number | boolean> }>;
    errors: Array<{
      rowNumber: number;
      columnName?: string;
      reason: string;
      rawValue?: string;
    }>;
  }) {
    await prisma.$transaction(async (tx) => {
      await tx.uploadError.deleteMany({ where: { uploadId: input.uploadId } });
      await tx.uploadValidRecord.deleteMany({ where: { uploadId: input.uploadId } });

      if (input.errors.length > 0) {
        await tx.uploadError.createMany({
          data: input.errors.map((error) => ({
            uploadId: input.uploadId,
            rowNumber: error.rowNumber,
            columnName: error.columnName ?? null,
            reason: error.reason,
            rawValue: error.rawValue ?? null
          }))
        });
      }

      if (input.validRecords.length > 0) {
        await tx.uploadValidRecord.createMany({
          data: input.validRecords.map((record) => ({
            uploadId: input.uploadId,
            rowNumber: record.rowNumber,
            data: record.data
          }))
        });
      }

      await tx.upload.update({
        where: { id: input.uploadId },
        data: {
          status: input.status,
          rowCount: input.rowCount,
          validRows: input.validRows,
          invalidRows: input.invalidRows,
          processingFinishedAt: new Date(),
          processingDurationMs: input.processingDurationMs
        }
      });
    });
  },

  async markFailed(uploadId: string, message: string, processingDurationMs?: number) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: "FAILED",
        errorMessage: message,
        processingFinishedAt: new Date(),
        processingDurationMs: processingDurationMs ?? null
      }
    });
  }
};
