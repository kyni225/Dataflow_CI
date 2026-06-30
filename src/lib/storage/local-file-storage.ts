import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";

export async function saveUploadFile(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);

  if (bytes.byteLength > maxBytes) {
    throw new Error("Le fichier depasse la limite de 10 MB.");
  }

  const extension = path.extname(file.name).toLowerCase();
  const safeName = `${randomUUID()}${extension}`;
  const root = path.resolve(uploadDir);
  const storagePath = path.join(root, safeName);

  await mkdir(root, { recursive: true });
  await writeFile(storagePath, bytes);

  return {
    storagePath,
    byteSize: bytes.byteLength,
    originalFileName: file.name,
    mimeType: file.type || guessMimeType(extension)
  };
}

export async function readUploadFile(storagePath: string) {
  return readFile(storagePath);
}

function guessMimeType(extension: string) {
  switch (extension) {
    case ".csv":
      return "text/csv";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream";
  }
}
