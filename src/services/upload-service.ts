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
    const sourceId = formData.get("sourceId");
    const file = formData.get("file");

    if (typeof sourceId !== "string" || !sourceId) {
      throw new AppError("Source requise.", 400);
    }

    if (!(file instanceof File)) {
      throw new AppError("Fichier requis.", 400);
    }

    if (!isSupportedFile(file.name)) {
      throw new AppError("Format non supporte. Utilisez CSV ou XLSX.", 400);
    }

    const { schemaVersion } = await sourceRepository.getActiveSchema(sourceId, ownerId);
    const storedFile = await saveUploadFile(file);

    const upload = await uploadRepository.create({
      sourceId,
      schemaVersionId: schemaVersion.id,
      uploadedById: ownerId,
      ...storedFile
    });

    await enqueueUploadProcessing(upload.id);

    return upload;
  }
};

function isSupportedFile(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension === "csv" || extension === "xlsx";
}
