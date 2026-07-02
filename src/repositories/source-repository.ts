import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { toPrismaColumnType } from "@/lib/validation/schema-mapper";
import type { SourceInput } from "@/lib/validation/source-schema";

const schemaInclude = {
  columns: {
    orderBy: { position: "asc" }
  }
} satisfies Prisma.SchemaVersionInclude;

export const sourceRepository = {
  async listByOwner(ownerId: string) {
    return prisma.source.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: {
        schemaVersions: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          include: schemaInclude,
          take: 1
        },
        _count: {
          select: { uploads: true, schemaVersions: true }
        }
      }
    });
  },

  async getByOwner(sourceId: string, ownerId: string) {
    const source = await prisma.source.findFirst({
      where: { id: sourceId, ownerId },
      include: {
        schemaVersions: {
          orderBy: { version: "desc" },
          include: schemaInclude
        },
        uploads: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!source) {
      throw new AppError("Source introuvable.", 404);
    }

    return source;
  },

  async getActiveSchema(sourceId: string, ownerId: string) {
    const source = await prisma.source.findFirst({
      where: { id: sourceId, ownerId },
      include: {
        schemaVersions: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          include: schemaInclude,
          take: 1
        }
      }
    });

    const schemaVersion = source?.schemaVersions[0];
    if (!source || !schemaVersion) {
      throw new AppError("Aucun schema actif pour cette source.", 404);
    }

    return { source, schemaVersion };
  },

  async create(ownerId: string, input: SourceInput) {
    try {
      return prisma.$transaction(async (tx) => {
        const source = await tx.source.create({
          data: {
            ownerId,
            externalId: input.externalId ?? null,
            name: input.name,
            description: input.description ?? null,
            ownerLabel: input.ownerLabel ?? null,
            expectedFrequency: input.expectedFrequency ?? null,
            fileFormat: input.fileFormat,
            delimiter: input.delimiter,
            encoding: input.encoding,
            hasHeader: input.hasHeader,
            rowConstraints: input.rowConstraints,
            schemaVersions: {
              create: {
                version: input.schemaVersion,
                isActive: true,
                createdById: ownerId,
                columns: {
                  create: input.columns.map((column, index) => ({
                    name: column.name,
                    type: toPrismaColumnType(column.type),
                    required: column.required,
                    regex: column.regex || null,
                    allowedValues: column.allowedValues ?? [],
                    min: column.min ?? null,
                    max: column.max ?? null,
                    minLength: column.minLength ?? null,
                    maxLength: column.maxLength ?? null,
                    dateFormat: column.dateFormat ?? null,
                    description: column.description || null,
                    position: column.position || index + 1
                  }))
                }
              }
            }
          },
          include: {
            schemaVersions: {
              include: schemaInclude
            }
          }
        });

        await tx.auditLog.create({
          data: {
            actorId: ownerId,
            sourceId: source.id,
            action: "SOURCE_CREATED",
            entityType: "Source",
            entityId: source.id,
            metadata: { version: input.schemaVersion, externalId: input.externalId }
          }
        });

        return source;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError("Une source avec ce nom existe deja.", 409);
      }
      throw error;
    }
  },

  async updateAndVersion(sourceId: string, ownerId: string, input: SourceInput) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.source.findFirst({
        where: { id: sourceId, ownerId },
        include: {
          schemaVersions: {
            orderBy: { version: "desc" },
            take: 1
          }
        }
      });

      if (!source) {
        throw new AppError("Source introuvable.", 404);
      }

      const latestVersion = source.schemaVersions[0]?.version ?? 0;
      const nextVersion = input.schemaVersion > latestVersion ? input.schemaVersion : latestVersion + 1;

      await tx.schemaVersion.updateMany({
        where: { sourceId },
        data: { isActive: false }
      });

      const updated = await tx.source.update({
        where: { id: sourceId },
        data: {
          externalId: input.externalId ?? source.externalId,
          name: input.name,
          description: input.description ?? null,
          ownerLabel: input.ownerLabel ?? null,
          expectedFrequency: input.expectedFrequency ?? null,
          fileFormat: input.fileFormat,
          delimiter: input.delimiter,
          encoding: input.encoding,
          hasHeader: input.hasHeader,
          rowConstraints: input.rowConstraints,
          schemaVersions: {
            create: {
              version: nextVersion,
              isActive: true,
              createdById: ownerId,
              columns: {
                create: input.columns.map((column, index) => ({
                  name: column.name,
                  type: toPrismaColumnType(column.type),
                  required: column.required,
                  regex: column.regex || null,
                  allowedValues: column.allowedValues ?? [],
                  min: column.min ?? null,
                  max: column.max ?? null,
                  minLength: column.minLength ?? null,
                  maxLength: column.maxLength ?? null,
                  dateFormat: column.dateFormat ?? null,
                  description: column.description || null,
                  position: column.position || index + 1
                }))
              }
            }
          }
        },
        include: {
          schemaVersions: {
            orderBy: { version: "desc" },
            include: schemaInclude
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: ownerId,
          sourceId,
          action: "SCHEMA_VERSION_CREATED",
          entityType: "SchemaVersion",
          entityId: updated.schemaVersions[0]?.id ?? sourceId,
          metadata: { version: nextVersion }
        }
      });

      return updated;
    });
  },

  async delete(sourceId: string, ownerId: string) {
    const source = await prisma.source.findFirst({
      where: { id: sourceId, ownerId },
      select: { id: true }
    });

    if (!source) {
      throw new AppError("Source introuvable.", 404);
    }

    await prisma.source.delete({ where: { id: sourceId } });
  }
};
