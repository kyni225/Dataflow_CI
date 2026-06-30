import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseDataFile } from "@/lib/validation/file-parser";
import { normalizeSourcePayload } from "@/lib/validation/source-schema";
import { validateRows } from "@/lib/validation/upload-validation";

describe("parseDataFile", () => {
  it("validates the official Orange clean sample at 100%", async () => {
    const source = normalizeSourcePayload(
      JSON.parse(await readFile(path.join(process.cwd(), "samples", "source-ventes-orange.json"), "utf8"))
    );
    const buffer = await readFile(path.join(process.cwd(), "samples", "ventes-orange-clean.csv"));
    const rows = await parseDataFile(buffer, "ventes-orange-clean.csv", source);
    const summary = validateRows(rows, source.columns, source.rowConstraints);

    expect(summary.rowCount).toBeGreaterThan(0);
    expect(summary.validRows).toBe(summary.rowCount);
    expect(summary.errors).toHaveLength(0);
  });

  it("validates the official Banque clean sample at 100% with semicolon delimiter", async () => {
    const source = normalizeSourcePayload(
      JSON.parse(await readFile(path.join(process.cwd(), "samples", "source-stock-banque.json"), "utf8"))
    );
    const buffer = await readFile(path.join(process.cwd(), "samples", "stock-banque-clean.csv"));
    const rows = await parseDataFile(buffer, "stock-banque-clean.csv", source);
    const summary = validateRows(rows, source.columns, source.rowConstraints);

    expect(summary.rowCount).toBeGreaterThan(0);
    expect(summary.validRows).toBe(summary.rowCount);
    expect(summary.errors).toHaveLength(0);
  });

  it("keeps valid rows and detailed errors for official dirty samples", async () => {
    const orangeSource = normalizeSourcePayload(
      JSON.parse(await readFile(path.join(process.cwd(), "samples", "source-ventes-orange.json"), "utf8"))
    );
    const bankSource = normalizeSourcePayload(
      JSON.parse(await readFile(path.join(process.cwd(), "samples", "source-stock-banque.json"), "utf8"))
    );

    const orangeRows = await parseDataFile(
      await readFile(path.join(process.cwd(), "samples", "ventes-orange-dirty.csv")),
      "ventes-orange-dirty.csv",
      orangeSource
    );
    const bankRows = await parseDataFile(
      await readFile(path.join(process.cwd(), "samples", "stock-banque-dirty.csv")),
      "stock-banque-dirty.csv",
      bankSource
    );

    const orangeSummary = validateRows(orangeRows, orangeSource.columns, orangeSource.rowConstraints);
    const bankSummary = validateRows(bankRows, bankSource.columns, bankSource.rowConstraints);

    expect(orangeSummary.errors.length).toBeGreaterThan(0);
    expect(bankSummary.errors.length).toBeGreaterThan(0);
    expect(orangeSummary.validRows).toBeGreaterThan(0);
    expect(bankSummary.validRows).toBeGreaterThan(0);
  });
});
