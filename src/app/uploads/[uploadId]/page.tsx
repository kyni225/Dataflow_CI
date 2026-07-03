import { auth } from "@/auth";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { uploadRepository } from "@/repositories/upload-repository";

export default async function UploadDetailsPage({
  params,
}: {
  params: Promise<{ uploadId: string }>;
}) {
  const { uploadId } = await params;
  console.log("[UploadDetails] uploadId:", uploadId);
  
  const session = await auth();
  console.log("[UploadDetails] session:", session?.user?.id);
  
  const upload = await uploadRepository.getForOwner(uploadId, session?.user?.id ?? "");
  console.log("[UploadDetails] upload:", upload?.id);

  if (!upload) {
    console.log("[UploadDetails] Upload not found or access denied");
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/uploads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux uploads
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{upload.originalFileName}</h1>
            <p className="text-sm text-muted-foreground">
              Statut: {upload.status} • {upload.validRows} lignes valides • {upload.invalidRows} lignes invalides
            </p>
          </div>
        </div>
        {upload.validRows > 0 && (
          <Button asChild>
            <Link href={`/api/uploads/${upload.id}/export-valid-rows`}>
              <Download className="h-4 w-4 mr-2" />
              Exporter les lignes valides
            </Link>
          </Button>
        )}
      </div>

      {upload.errors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Erreurs ({upload.errors.length})</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Ligne</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Colonne</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Raison</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {upload.errors.map((error) => (
                  <tr key={error.id} className="border-t">
                    <td className="px-4 py-2 text-sm">{error.rowNumber}</td>
                    <td className="px-4 py-2 text-sm">{error.columnName || "-"}</td>
                    <td className="px-4 py-2 text-sm">{error.reason}</td>
                    <td className="px-4 py-2 text-sm font-mono text-xs">{error.rawValue || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {upload.errors.length === 0 && upload.invalidRows > 0 && (
        <p className="text-muted-foreground">Aucune erreur détaillée disponible.</p>
      )}

      {upload.invalidRows === 0 && upload.validRows > 0 && (
        <p className="text-green-600 font-medium">Toutes les lignes sont valides !</p>
      )}
    </div>
  );
}
