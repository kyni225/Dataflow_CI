import { ColumnType, type SchemaColumn } from "@prisma/client";

import type { ColumnDefinition, SupportedColumnType } from "@/types/schema";

export function toPrismaColumnType(type: SupportedColumnType) {
  switch (type) {
    case "string":
      return ColumnType.STRING;
    case "number":
      return ColumnType.NUMBER;
    case "integer":
      return ColumnType.INTEGER;
    case "date":
      return ColumnType.DATE;
    case "boolean":
      return ColumnType.BOOLEAN;
    case "enum":
      return ColumnType.ENUM;
  }
}

export function toDomainColumn(column: SchemaColumn): ColumnDefinition {
  return {
    id: column.id,
    name: column.name,
    type: fromPrismaColumnType(column.type),
    required: column.required,
    regex: column.regex,
    allowedValues: column.allowedValues,
    min: column.min,
    max: column.max,
    minLength: column.minLength,
    maxLength: column.maxLength,
    dateFormat: column.dateFormat,
    description: column.description,
    position: column.position
  };
}

function fromPrismaColumnType(type: ColumnType): SupportedColumnType {
  switch (type) {
    case ColumnType.STRING:
      return "string";
    case ColumnType.NUMBER:
      return "number";
    case ColumnType.INTEGER:
      return "integer";
    case ColumnType.DATE:
      return "date";
    case ColumnType.BOOLEAN:
      return "boolean";
    case ColumnType.ENUM:
      return "enum";
  }
}
