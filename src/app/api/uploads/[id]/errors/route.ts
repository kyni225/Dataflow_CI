import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20");
  const columnName = url.searchParams.get("columnName");

  try {
    const upload = await prisma.upload.findUnique({
      where: { id: params.id },
      select: { sourceId: true, uploadedById: true }
    });

    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    if (upload.uploadedById !== session.user.id) 
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const where = { uploadId: params.id, ...(columnName && { columnName }) };
    
    const [errors, total] = await Promise.all([
      prisma.uploadError.findMany({
        where,
        orderBy: [{ rowNumber: "asc" }, { columnName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { rowNumber: true, columnName: true, reason: true, rawValue: true }
      }),
      prisma.uploadError.count({ where })
    ]);

    return NextResponse.json({
      errors,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
