import Papa from "papaparse";
import ExcelJS from "exceljs";

import type { ParsedRow, SourceFileConfig } from "@/types/schema";

export async function parseDataFile(
  buffer: Buffer,
  fileName: string,
  config: SourceFileConfig = {
    fileFormat: "csv",
    delimiter: ",",
    encoding: "utf-8",
    hasHeader: true
  }
): Promise<ParsedRow[]> {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCsv(buffer, config);
  }

  if (extension === "xlsx") {
    return parseWorkbook(buffer);
  }

  throw new Error("Format non supporte. Utilisez CSV ou XLSX.");
}

function parseCsv(buffer: Buffer, config: SourceFileConfig) {
  if (!config.hasHeader) {
    throw new Error("Les CSV sans header ne sont pas supportes dans ce MVP.");
  }

  const result = Papa.parse<ParsedRow>(buffer.toString(toBufferEncoding(config.encoding)), {
    delimiter: config.delimiter,
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new Error(firstError?.message ?? "CSV invalide.");
  }

  return result.data;
}

async function parseWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Classeur Excel vide.");
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headers[columnNumber - 1] = String(normalizeExcelValue(cell.value)).trim();
  });

  const rows: ParsedRow[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const record: ParsedRow = {};
    headers.forEach((header, index) => {
      if (!header) {
        return;
      }

      record[header] = normalizeExcelValue(row.getCell(index + 1).value);
    });
    rows.push(record);
  });

  return rows;
}

function normalizeExcelValue(value: ExcelJS.CellValue): ParsedRow[string] {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if ("result" in value && value.result != null) {
    return normalizeExcelValue(value.result);
  }

  if ("text" in value && value.text != null) {
    return value.text;
  }

  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("");
  }

  return String(value);
}

function toBufferEncoding(encoding: string): BufferEncoding {
  const normalized = encoding.toLowerCase().replace("-", "");
  if (normalized === "utf8") {
    return "utf8";
  }
  return "utf8";
}
