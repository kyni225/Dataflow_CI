import { auth } from "@/auth";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { uploadRepository } from "@/repositories/upload-repository";

export default async function UploadsPage() {
  const session = await auth();
  const uploads = await uploadRepository.listByOwner(session?.user?.id ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Uploads</h1>
        <Button asChild>
          <Link href="/uploads/new">Nouvel upload</Link>
        </Button>
      </div>

      {uploads.length === 0 ? (
        <p className="text-muted-foreground">Aucun upload pour le moment.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Fichier</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Source</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Statut</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Valides</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Invalides</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => (
                <tr key={upload.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-2 text-sm">
                    <Link href={`/uploads/${upload.id}`} className="hover:underline">
                      {upload.originalFileName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm">{upload.source.name}</td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        upload.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : upload.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : upload.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {upload.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{upload.validRows}</td>
                  <td className="px-4 py-2 text-sm">{upload.invalidRows}</td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(upload.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
