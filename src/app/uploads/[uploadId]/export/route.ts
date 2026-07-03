import { NextResponse } from "next/server";

import { uploadRepository } from "@/repositories/upload-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;
  const upload = await uploadRepository.getUploadDetails(uploadId);

  if (!upload) {
    return NextResponse.json({ error: "Upload introuvable" }, { status: 404 });
  }

  if (upload.validRecords.length === 0) {
    return NextResponse.json({ error: "Aucune ligne valide à exporter" }, { status: 400 });
  }

  // Get column names from schema
  const columns = upload.schemaVersion.columns.map(col => col.name);

  // Build CSV content
  const headers = columns.join(",");
  const rows = upload.validRecords
    .sort((a, b) => a.rowNumber - b.rowNumber)
    .map(record => {
      const data = record.data as Record<string, string | number | boolean>;
      return columns.map(col => {
        const value = data[col];
        // Escape quotes and wrap in quotes if contains comma or quote
        const strValue = String(value ?? "");
        if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(",");
    });

  const csvContent = [headers, ...rows].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${upload.originalFileName.replace(/\.[^/.]+$/, "")}_valides.csv"`,
    },
  });
}
