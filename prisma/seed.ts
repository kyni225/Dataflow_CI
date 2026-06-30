import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { normalizeSourcePayload, type SourceInput } from "../src/lib/validation/source-schema";
import { toPrismaColumnType } from "../src/lib/validation/schema-mapper";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("DemoPassword123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@dataflow.ci" },
    update: {},
    create: {
      email: "demo@dataflow.ci",
      name: "Demo DataFlow",
      passwordHash
    }
  });

  for (const fileName of ["source-ventes-orange.json", "source-stock-banque.json"]) {
    const raw = JSON.parse(
      await readFile(path.join(process.cwd(), "samples", fileName), "utf8")
    ) as unknown;
    await upsertSourceFromSchema(user.id, normalizeSourcePayload(raw));
  }
}

async function upsertSourceFromSchema(ownerId: string, input: SourceInput) {
  const source = await prisma.source.upsert({
    where: {
      ownerId_externalId: {
        ownerId,
        externalId: input.externalId ?? ""
      }
    },
    update: {
      name: input.name,
      description: input.description ?? null,
      ownerLabel: input.ownerLabel ?? null,
      expectedFrequency: input.expectedFrequency ?? null,
      fileFormat: input.fileFormat,
      delimiter: input.delimiter,
      encoding: input.encoding,
      hasHeader: input.hasHeader,
      rowConstraints: input.rowConstraints
    },
    create: {
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
      rowConstraints: input.rowConstraints
    }
  });

  const existingVersion = await prisma.schemaVersion.findUnique({
    where: {
      sourceId_version: {
        sourceId: source.id,
        version: input.schemaVersion
      }
    }
  });

  if (!existingVersion) {
    await prisma.schemaVersion.updateMany({
      where: { sourceId: source.id },
      data: { isActive: false }
    });

    await prisma.schemaVersion.create({
      data: {
        sourceId: source.id,
        createdById: ownerId,
        version: input.schemaVersion,
        isActive: true,
        columns: {
          create: input.columns.map((column, index) => ({
            position: index + 1,
            name: column.name,
            type: toPrismaColumnType(column.type),
            required: column.required,
            regex: column.regex ?? null,
            allowedValues: column.allowedValues ?? [],
            min: column.min ?? null,
            max: column.max ?? null,
            minLength: column.minLength ?? null,
            maxLength: column.maxLength ?? null,
            dateFormat: column.dateFormat ?? null,
            description: column.description ?? null
          }))
        }
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: ownerId,
      sourceId: source.id,
      action: "SEED",
      entityType: "Source",
      entityId: source.id,
      metadata: { externalId: input.externalId, version: input.schemaVersion }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
