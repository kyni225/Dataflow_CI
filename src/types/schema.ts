export type SupportedColumnType = "string" | "number" | "integer" | "date" | "boolean" | "enum";

export type ColumnDefinition = {
  id?: string;
  name: string;
  type: SupportedColumnType;
  required: boolean;
  regex?: string | null;
  allowedValues?: string[];
  min?: number | null;
  max?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  dateFormat?: string | null;
  description?: string | null;
  position: number;
};

export type ParsedRow = Record<string, string | number | boolean | Date | null | undefined>;

export type ValidationIssue = {
  rowNumber: number;
  columnName?: string;
  reason: string;
  rawValue?: string;
};

export type ValidatedRecord = {
  rowNumber: number;
  data: Record<string, string | number | boolean>;
};

export type ValidationSummary = {
  rowCount: number;
  validRows: number;
  invalidRows: number;
  validRecords: ValidatedRecord[];
  errors: ValidationIssue[];
};

export type SourceFileConfig = {
  fileFormat: "csv" | "xlsx";
  delimiter: string;
  encoding: string;
  hasHeader: boolean;
};

export type RowConstraintDefinition = {
  name: string;
  description?: string | null;
};
