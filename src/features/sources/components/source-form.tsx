"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileJson, Loader2, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { normalizeSourcePayload, type SourceInput } from "@/lib/validation/source-schema";

type InitialSource = SourceInput & {
  id: string;
};

export function SourceForm({ initialSource }: { initialSource?: InitialSource }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [rawSchema, setRawSchema] = React.useState<unknown | null>(initialSource ?? null);
  const [preview, setPreview] = React.useState<SourceInput | null>(initialSource ?? null);

  async function onSchemaFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const json = JSON.parse(await file.text()) as unknown;
      const normalized = normalizeSourcePayload(json);
      setRawSchema(json);
      setPreview(normalized);
      toast({
        title: "Schema charge",
        description: `${normalized.name} - ${normalized.columns.length} colonnes.`
      });
    } catch (error) {
      setRawSchema(null);
      setPreview(null);
      toast({
        title: "Schema invalide",
        description: error instanceof Error ? error.message : "Impossible de lire le JSON.",
        variant: "destructive"
      });
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preview || !rawSchema) {
      toast({
        title: "Schema requis",
        description: "Chargez un fichier JSON de source avant de valider.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(initialSource ? `/api/sources/${initialSource.id}` : "/api/sources", {
        method: initialSource ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawSchema)
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Enregistrement impossible.");
      }

      const body = await response.json();
      toast({
        title: initialSource ? "Nouvelle version creee" : "Source creee",
        description: "La configuration provient du schema JSON importe."
      });
      router.push(`/sources/${body.source.id}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inattendue.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialSource ? "Importer une nouvelle version" : "Nouvelle source"}</CardTitle>
          <CardDescription>
            La source est creee depuis un schema JSON Artefact. Les colonnes, le separateur CSV et
            les formats de date viennent du fichier importe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schema-json">Schema JSON</Label>
            <Input
              id="schema-json"
              type="file"
              accept="application/json,.json"
              onChange={onSchemaFileChange}
              required={!initialSource}
            />
          </div>

          {preview ? <SchemaPreview preview={preview} /> : <EmptySchemaPreview />}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !preview}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {initialSource ? "Creer la version" : "Creer la source"}
        </Button>
      </div>
    </form>
  );
}

function EmptySchemaPreview() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      <FileJson className="mx-auto mb-2 h-8 w-8" aria-hidden="true" />
      Chargez `source-ventes-orange.json` ou `source-stock-banque.json` pour afficher la
      configuration derivee du schema.
    </div>
  );
}

function SchemaPreview({ preview }: { preview: SourceInput }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <PreviewItem label="Source" value={preview.name} />
        <PreviewItem label="ID externe" value={preview.externalId ?? "-"} />
        <PreviewItem label="Version schema" value={`v${preview.schemaVersion}`} />
        <PreviewItem label="Owner" value={preview.ownerLabel ?? "-"} />
        <PreviewItem label="Format fichier" value={preview.fileFormat.toUpperCase()} />
        <PreviewItem label="Separateur" value={preview.delimiter} />
        <PreviewItem label="Encoding" value={preview.encoding} />
        <PreviewItem label="Header" value={preview.hasHeader ? "oui" : "non"} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Colonnes derivees du JSON</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Regles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.columns.map((column) => (
              <TableRow key={column.name}>
                <TableCell className="font-medium">{column.name}</TableCell>
                <TableCell>{column.type}</TableCell>
                <TableCell>
                  <Badge variant={column.required ? "default" : "secondary"}>
                    {column.required ? "oui" : "non"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRules(column)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {preview.rowConstraints.length > 0 ? (
        <div className="rounded-lg border p-3">
          <h3 className="text-sm font-medium">Contraintes de ligne</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {preview.rowConstraints.map((constraint) => (
              <li key={constraint.name}>
                <span className="font-medium text-foreground">{constraint.name}</span>
                {constraint.description ? ` - ${constraint.description}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function formatRules(column: SourceInput["columns"][number]) {
  const rules = [
    column.dateFormat ? `format: ${column.dateFormat}` : null,
    column.regex ? `pattern: ${column.regex}` : null,
    column.allowedValues.length ? `values: ${column.allowedValues.join(", ")}` : null,
    column.min != null ? `min: ${column.min}` : null,
    column.max != null ? `max: ${column.max}` : null,
    column.minLength != null ? `min_length: ${column.minLength}` : null,
    column.maxLength != null ? `max_length: ${column.maxLength}` : null
  ].filter(Boolean);

  return rules.join(" | ") || "-";
}
