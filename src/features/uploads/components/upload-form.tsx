"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type SourceOption = {
  id: string;
  name: string;
};

type UploadFormProps = {
  sources: SourceOption[];
  initialSourceId?: string | undefined;
};

export function UploadForm({ sources, initialSourceId }: UploadFormProps) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState(initialSourceId || "");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceId || !file) {
      setError("Veuillez sélectionner une source et un fichier.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("sourceId", sourceId);
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'upload.");
      }

      const data = await response.json();
      router.push(`/uploads/${data.upload.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nouvel upload</h1>
        <p className="text-muted-foreground">Uploadez un fichier CSV ou Excel pour le traitement.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select
            id="source"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            <option value="">Sélectionnez une source</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Fichier (CSV ou Excel, max 10MB)</Label>
          <Input
            id="file"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Upload en cours..." : "Uploader"}
        </Button>
      </form>
    </div>
  );
}