import { z } from "zod";

export const columnTypeSchema = z.enum(["string", "number", "integer", "date", "boolean", "enum"]);

export const schemaColumnInput = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(1, "Le nom de colonne est requis.")
      .regex(/^[a-zA-Z0-9_ -]+$/, "Le nom contient des caracteres non supportes."),
    type: columnTypeSchema,
    required: z.boolean().default(false),
    regex: z.string().trim().optional().nullable(),
    allowedValues: z.array(z.string().trim().min(1)).default([]),
    min: z.coerce.number().optional().nullable(),
    max: z.coerce.number().optional().nullable(),
    minLength: z.coerce.number().int().optional().nullable(),
    maxLength: z.coerce.number().int().optional().nullable(),
    dateFormat: z.string().trim().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    position: z.number().int().min(1)
  })
  .superRefine((column, context) => {
    if (column.min != null && column.max != null && column.min > column.max) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max"],
        message: "La borne max doit etre superieure ou egale a min."
      });
    }

    if (column.regex) {
      try {
        new RegExp(column.regex);
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["regex"],
          message: "Expression reguliere invalide."
        });
      }
    }

    if (column.minLength != null && column.maxLength != null && column.minLength > column.maxLength) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxLength"],
        message: "La longueur max doit etre superieure ou egale a minLength."
      });
    }
  });

export const sourceInputSchema = z.object({
  externalId: z.string().trim().optional().nullable(),
  name: z.string().trim().min(2, "Le nom est requis."),
  description: z.string().trim().optional().nullable(),
  ownerLabel: z.string().trim().optional().nullable(),
  schemaVersion: z.number().int().positive().default(1),
  expectedFrequency: z.string().trim().optional().nullable(),
  fileFormat: z.enum(["csv", "xlsx"]).default("csv"),
  delimiter: z.string().min(1).default(","),
  encoding: z.string().trim().default("utf-8"),
  hasHeader: z.boolean().default(true),
  rowConstraints: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        description: z.string().trim().optional().nullable()
      })
    )
    .default([]),
  columns: z
    .array(schemaColumnInput)
    .min(1, "Une source doit avoir au moins une colonne.")
    .superRefine((columns, context) => {
      const names = new Set<string>();
      columns.forEach((column, index) => {
        const key = column.name.toLowerCase();
        if (names.has(key)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "name"],
            message: "Nom de colonne duplique."
          });
        }
        names.add(key);
      });
    })
});

const officialColumnSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["string", "number", "integer", "date", "boolean", "enum"]),
  required: z.boolean().default(false),
  format: z.string().trim().optional(),
  pattern: z.string().trim().optional(),
  allowed_values: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  min_length: z.number().int().optional(),
  max_length: z.number().int().optional(),
  description: z.string().optional()
});

export const officialSourceSchema = z.object({
  source_id: z.string().trim().min(1),
  source_name: z.string().trim().min(2),
  description: z.string().optional(),
  owner: z.string().optional(),
  version: z.number().int().positive().default(1),
  expected_frequency: z.string().optional(),
  file_format: z.enum(["csv"]).default("csv"),
  delimiter: z.string().min(1).default(","),
  encoding: z.string().default("utf-8"),
  has_header: z.boolean().default(true),
  schema: z.object({
    columns: z.array(officialColumnSchema).min(1),
    row_constraints: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          description: z.string().optional()
        })
      )
      .default([])
  })
});

export function normalizeSourcePayload(payload: unknown): SourceInput {
  const official = officialSourceSchema.safeParse(payload);
  if (official.success) {
    return sourceInputSchema.parse({
      externalId: official.data.source_id,
      name: official.data.source_name,
      description: official.data.description ?? null,
      ownerLabel: official.data.owner ?? null,
      schemaVersion: official.data.version,
      expectedFrequency: official.data.expected_frequency ?? null,
      fileFormat: official.data.file_format,
      delimiter: official.data.delimiter,
      encoding: official.data.encoding,
      hasHeader: official.data.has_header,
      rowConstraints: official.data.schema.row_constraints.map((constraint) => ({
        name: constraint.name,
        description: constraint.description ?? null
      })),
      columns: official.data.schema.columns.map((column, index) => ({
        name: column.name,
        type: column.type,
        required: column.required,
        regex: column.pattern ?? null,
        allowedValues: column.allowed_values ?? [],
        min: column.min ?? null,
        max: column.max ?? null,
        minLength: column.min_length ?? null,
        maxLength: column.max_length ?? null,
        dateFormat: column.format ?? null,
        description: column.description ?? null,
        position: index + 1
      }))
    });
  }

  return sourceInputSchema.parse(payload);
}

export type SourceInput = z.infer<typeof sourceInputSchema>;
export type SchemaColumnInput = z.infer<typeof schemaColumnInput>;
export type OfficialSourceSchema = z.infer<typeof officialSourceSchema>;
