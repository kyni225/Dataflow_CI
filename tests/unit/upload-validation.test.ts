import { describe, expect, it } from "vitest";

import { validateRows } from "@/lib/validation/upload-validation";
import type { ColumnDefinition, ParsedRow } from "@/types/schema";

const columns: ColumnDefinition[] = [
  {
    name: "date",
    type: "date",
    required: true,
    position: 1
  },
  {
    name: "region",
    type: "string",
    required: true,
    allowedValues: ["Abidjan", "Bouake"],
    position: 2
  },
  {
    name: "montant_fcfa",
    type: "number",
    required: true,
    min: 0,
    position: 3
  },
  {
    name: "client_id",
    type: "string",
    required: true,
    regex: "^CLI-\\d{6}$",
    position: 4
  }
];

describe("validateRows", () => {
  it("separates valid and invalid records while keeping all errors", () => {
    const rows: ParsedRow[] = [
      {
        date: "2026-05-01",
        region: "Abidjan",
        montant_fcfa: "125000",
        client_id: "CLI-000001"
      },
      {
        date: "bad-date",
        region: "Man",
        montant_fcfa: "-10",
        client_id: "CLIENT-2"
      }
    ];

    const summary = validateRows(rows, columns);

    expect(summary.rowCount).toBe(2);
    expect(summary.validRows).toBe(1);
    expect(summary.invalidRows).toBe(1);
    expect(summary.validRecords[0]?.data).toEqual({
      date: "2026-05-01",
      region: "Abidjan",
      montant_fcfa: 125000,
      client_id: "CLI-000001"
    });
    expect(summary.errors).toHaveLength(4);
    expect(summary.errors.map((error) => error.columnName)).toEqual([
      "date",
      "region",
      "montant_fcfa",
      "client_id"
    ]);
  });

  it("accepts european dates and localized boolean values", () => {
    const summary = validateRows(
      [
        {
          date_stock: "10/06/2026",
          rupture: "oui"
        }
      ],
      [
        { name: "date_stock", type: "date", required: true, position: 1 },
        { name: "rupture", type: "boolean", required: true, position: 2 }
      ]
    );

    expect(summary.validRows).toBe(1);
    expect(summary.validRecords[0]?.data).toEqual({
      date_stock: "2026-06-10",
      rupture: true
    });
  });
});
