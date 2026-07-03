import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const upload = await prisma.upload.findUnique({
      where: { id: params.id },
      include: {
        schemaVersion: { include: { columns: { orderBy: { position: "asc" } } } },
        source: true,
        uploadedBy: true
      }
    });

    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    if (upload.uploadedById !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const validRecords = await prisma.uploadValidRecord.findMany({
      where: { uploadId: params.id },
      orderBy: { rowNumber: "asc" }
    });

    // Construire le CSV
    const columns = upload.schemaVersion.columns;
    const headers = columns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(",");
    
    const rows = validRecords.map(record => {
      return columns
        .map(col => {
          const value = record.data[col.name];
          if (value === null || value === undefined) return '""';
          const strValue = String(value).replace(/"/g, '""');
          return `"${strValue}"`;
        })
        .join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const filename = `${upload.source.name}-valid-rows-${upload.id}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"` 
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
