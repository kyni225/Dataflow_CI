import { sourceRepository } from "@/repositories/source-repository";
import { normalizeSourcePayload, type SourceInput } from "@/lib/validation/source-schema";

export const sourceService = {
  list(ownerId: string) {
    return sourceRepository.listByOwner(ownerId);
  },

  get(sourceId: string, ownerId: string) {
    return sourceRepository.getByOwner(sourceId, ownerId);
  },

  create(ownerId: string, payload: unknown) {
    const input = normalizeSourcePayload(payload);
    return sourceRepository.create(ownerId, normalizePositions(input));
  },

  update(sourceId: string, ownerId: string, payload: unknown) {
    const input = normalizeSourcePayload(payload);
    return sourceRepository.updateAndVersion(sourceId, ownerId, normalizePositions(input));
  },

  delete(sourceId: string, ownerId: string) {
    return sourceRepository.delete(sourceId, ownerId);
  }
};

function normalizePositions(input: SourceInput) {
  return {
    ...input,
    columns: input.columns.map((column, index) => ({
      ...column,
      position: index + 1
    }))
  };
}
