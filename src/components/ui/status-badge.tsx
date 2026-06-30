import type { UploadStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const statusLabel: Record<UploadStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SUCCESS: "Success",
  PARTIAL: "Partial",
  FAILED: "Failed"
};

export function StatusBadge({ status }: { status: UploadStatus }) {
  const variant =
    status === "SUCCESS"
      ? "success"
      : status === "PARTIAL" || status === "PROCESSING" || status === "PENDING"
        ? "warning"
        : "destructive";

  return <Badge variant={variant}>{statusLabel[status]}</Badge>;
}
