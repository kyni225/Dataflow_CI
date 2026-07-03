import { AppError } from "@/lib/errors/app-error";
import { enqueueUploadProcessing } from "@/lib/queue/upload-queue";
import { saveUploadFile } from "@/lib/storage/local-file-storage";
import { sourceRepository } from "@/repositories/source-repository";
import { uploadRepository } from "@/repositories/upload-repository";

export const uploadService = {
  list(ownerId: string) {
    return uploadRepository.listByOwner(ownerId);
  },

  get(uploadId: string, ownerId: string) {
    return uploadRepository.getForOwner(uploadId, ownerId);
  },

  async create(ownerId: string, formData: FormData) {
    console.log("[UploadService] Starting upload creation for user:", ownerId);
    
    const sourceId = formData.get("sourceId");
    const file = formData.get("file");

    console.log("[UploadService] sourceId:", sourceId, "file:", file);

    if (typeof sourceId !== "string" || !sourceId) {
      console.error("[UploadService] Missing or invalid sourceId");
      throw new AppError("Source requise.", 400);
    }

    if (!(file instanceof File)) {
      console.error("[UploadService] Invalid file");
      throw new AppError("Fichier requis.", 400);
    }

    if (!isSupportedFile(file.name)) {
      console.error("[UploadService] Unsupported file format:", file.name);
      throw new AppError("Format non supporte. Utilisez CSV ou XLSX.", 400);
    }

    console.log("[UploadService] Getting active schema for source:", sourceId);
    const { schemaVersion } = await sourceRepository.getActiveSchema(sourceId, ownerId);
    console.log("[UploadService] Schema version found:", schemaVersion.id);
    
    console.log("[UploadService] Saving file to disk");
    const storedFile = await saveUploadFile(file);
    console.log("[UploadService] File saved:", storedFile.storagePath);

    console.log("[UploadService] Creating upload record in database");
    const upload = await uploadRepository.create({
      sourceId,
      schemaVersionId: schemaVersion.id,
      uploadedById: ownerId,
      ...storedFile
    });
    console.log("[UploadService] Upload record created:", upload.id);

    console.log("[UploadService] Enqueueing upload processing");
    await enqueueUploadProcessing(upload.id);
    console.log("[UploadService] Upload processing enqueued");

    return upload;
  }
};

function isSupportedFile(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "csv" || extension === "xlsx";
}
