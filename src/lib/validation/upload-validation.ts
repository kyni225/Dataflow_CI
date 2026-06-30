import type {
  ColumnDefinition,
  ParsedRow,
  RowConstraintDefinition,
  ValidatedRecord,
  ValidationIssue,
  ValidationSummary
} from "@/types/schema";

const emptyValues = new Set(["", "null", "undefined"]);

export function validateRows(
  rows: ParsedRow[],
  columns: ColumnDefinition[],
  rowConstraints: RowConstraintDefinition[] = []
): ValidationSummary {
  const validRecords: ValidatedRecord[] = [];
  const errors: ValidationIssue[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: ValidationIssue[] = [];
    const normalized: Record<string, string | number | boolean> = {};

    for (const column of columns) {
      const rawValue = row[column.name];
      const result = validateCell(rawValue, column);

      if (!result.ok) {
        rowErrors.push({
          rowNumber,
          columnName: column.name,
          reason: result.reason,
          rawValue: stringifyRawValue(rawValue)
        });
        continue;
      }

      if (result.value !== undefined) {
        normalized[column.name] = result.value;
      }
    }

    if (rowErrors.length === 0) {
      validRecords.push({ rowNumber, data: normalized });
    } else {
      errors.push(...rowErrors);
    }
  });

  const rowConstraintErrors = validateRowConstraints(validRecords, rowConstraints);
  const invalidRecordNumbers = new Set(rowConstraintErrors.map((error) => error.rowNumber));
  const filteredValidRecords = validRecords.filter(
    (record) => !invalidRecordNumbers.has(record.rowNumber)
  );

  return {
    rowCount: rows.length,
    validRows: filteredValidRecords.length,
    invalidRows: rows.length - filteredValidRecords.length,
    validRecords: filteredValidRecords,
    errors: [...errors, ...rowConstraintErrors]
  };
}

type CellResult =
  | { ok: true; value: string | number | boolean | undefined }
  | { ok: false; reason: string };

function validateCell(rawValue: ParsedRow[string], column: ColumnDefinition): CellResult {
  const missing = isMissing(rawValue);

  if (missing && column.required) {
    return { ok: false, reason: "Valeur obligatoire manquante." };
  }

  if (missing) {
    return { ok: true, value: undefined };
  }

  const typed = coerceValue(rawValue, column);
  if (!typed.ok) {
    return { ok: false, reason: typed.reason };
  }

  if (column.allowedValues?.length && !column.allowedValues.includes(String(typed.value))) {
    return {
      ok: false,
      reason: `Valeur non autorisee. Attendu: ${column.allowedValues.join(", ")}.`
    };
  }

  if (column.regex) {
    const pattern = new RegExp(column.regex);
    if (!pattern.test(String(typed.value))) {
      return { ok: false, reason: `Format invalide. Regex attendue: ${column.regex}.` };
    }
  }

  if (typeof typed.value === "string") {
    if (column.minLength != null && typed.value.length < column.minLength) {
      return { ok: false, reason: `Longueur inferieure au minimum ${column.minLength}.` };
    }

    if (column.maxLength != null && typed.value.length > column.maxLength) {
      return { ok: false, reason: `Longueur superieure au maximum ${column.maxLength}.` };
    }
  }

  if (typeof typed.value === "number") {
    if (column.min != null && typed.value < column.min) {
      return { ok: false, reason: `Valeur inferieure au minimum ${column.min}.` };
    }

    if (column.max != null && typed.value > column.max) {
      return { ok: false, reason: `Valeur superieure au maximum ${column.max}.` };
    }
  }

  return { ok: true, value: typed.value };
}

function coerceValue(value: ParsedRow[string], column: ColumnDefinition): CellResult {
  switch (column.type) {
    case "string":
    case "enum":
      return { ok: true, value: String(value).trim() };
    case "number": {
      const numberValue = typeof value === "number" ? value : Number(String(value).replace(",", "."));
      if (!Number.isFinite(numberValue)) {
        return { ok: false, reason: "Nombre invalide." };
      }
      return { ok: true, value: numberValue };
    }
    case "integer": {
      const numberValue = typeof value === "number" ? value : Number(String(value).replace(",", "."));
      if (!Number.isInteger(numberValue)) {
        return { ok: false, reason: "Entier invalide." };
      }
      return { ok: true, value: numberValue };
    }
    case "date": {
      const dateValue = normalizeDate(value, column.dateFormat);
      if (!dateValue) {
        return {
          ok: false,
          reason: column.dateFormat
            ? `Date invalide. Format attendu: ${column.dateFormat}.`
            : "Date invalide."
        };
      }

      if (column.description?.toLowerCase().includes("futur") && dateValue > todayIso()) {
        return { ok: false, reason: "Date dans le futur interdite." };
      }

      return { ok: true, value: dateValue };
    }
    case "boolean": {
      const booleanValue = normalizeBoolean(value);
      if (booleanValue == null) {
        return { ok: false, reason: "Booleen invalide." };
      }
      return { ok: true, value: booleanValue };
    }
  }
}

function normalizeDate(value: ParsedRow[string], format?: string | null) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  if (format === "YYYY-MM-DD") {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    return iso ? validIsoDate(`${iso[1]}-${iso[2]}-${iso[3]}`) : null;
  }

  if (format === "DD/MM/YYYY") {
    const europeanStrict = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!europeanStrict) {
      return null;
    }
    const [, day, month, year] = europeanStrict;
    return validIsoDate(`${year}-${month}-${day}`);
  }

  const european = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (european) {
    const [, day, month, year] = european;
    return validIsoDate(`${year}-${month}-${day}`);
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function validIsoDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const normalized = parsed.toISOString().slice(0, 10);
  return normalized === isoDate ? normalized : null;
}

function normalizeBoolean(value: ParsedRow[string]) {
  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "oui", "vrai"].includes(text)) {
    return true;
  }
  if (["false", "0", "no", "non", "faux"].includes(text)) {
    return false;
  }
  return null;
}

function validateRowConstraints(
  records: ValidatedRecord[],
  constraints: RowConstraintDefinition[]
) {
  return constraints.flatMap((constraint) => {
    if (constraint.name.startsWith("unique_")) {
      return validateUniqueConstraint(records, constraint);
    }

    if (constraint.name === "reappro_before_inventory") {
      return validateReapproBeforeInventory(records);
    }

    return [];
  });
}

function validateUniqueConstraint(
  records: ValidatedRecord[],
  constraint: RowConstraintDefinition
): ValidationIssue[] {
  const columns = resolveUniqueConstraintColumns(constraint);
  if (columns.length === 0) {
    return [];
  }

  const seen = new Map<string, number>();
  const errors: ValidationIssue[] = [];

  for (const record of records) {
    const key = columns.map((column) => String(record.data[column] ?? "")).join("::");
    const firstRow = seen.get(key);

    if (firstRow) {
      errors.push({
        rowNumber: record.rowNumber,
        columnName: columns.join(", "),
        reason: `Doublon detecte avec la ligne ${firstRow} pour la contrainte ${constraint.name}.`,
        rawValue: key
      });
    } else {
      seen.set(key, record.rowNumber);
    }
  }

  return errors;
}

function resolveUniqueConstraintColumns(constraint: RowConstraintDefinition) {
  if (constraint.name === "unique_per_day_per_agency_per_card") {
    return ["date_inventaire", "agence_id", "type_carte"];
  }

  if (constraint.name === "unique_per_day_per_agency") {
    return ["date_vente", "agence_code", "type_forfait"];
  }

  const match = constraint.description?.match(/\(([^)]+)\)/);
  const columnsGroup = match?.[1];
  if (!columnsGroup) {
    return [];
  }

  return columnsGroup
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function validateReapproBeforeInventory(records: ValidatedRecord[]): ValidationIssue[] {
  return records.flatMap((record) => {
    const reappro = record.data.dernier_reapprovisionnement;
    const inventory = record.data.date_inventaire;

    if (!reappro || !inventory || String(reappro) <= String(inventory)) {
      return [];
    }

    return [
      {
        rowNumber: record.rowNumber,
        columnName: "dernier_reapprovisionnement",
        reason: "Le dernier reapprovisionnement doit etre inferieur ou egal a la date d'inventaire.",
        rawValue: String(reappro)
      }
    ];
  });
}

function isMissing(value: ParsedRow[string]) {
  return value == null || emptyValues.has(String(value).trim().toLowerCase());
}

function stringifyRawValue(value: ParsedRow[string]) {
  if (value == null) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
