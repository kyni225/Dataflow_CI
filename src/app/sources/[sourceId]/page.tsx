import Link from "next/link";
import { UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteSourceButton } from "@/features/sources/components/delete-source-button";
import { SourceForm } from "@/features/sources/components/source-form";
import { requireUser } from "@/lib/session";
import { toDomainColumn } from "@/lib/validation/schema-mapper";
import { formatDate } from "@/lib/utils";
import { sourceService } from "@/services/source-service";
import type { RowConstraintDefinition } from "@/types/schema";

type PageProps = {
  params: Promise<{ sourceId: string }>;
};

export default async function SourceDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { sourceId } = await params;
  const source = await sourceService.get(sourceId, user.id);
  const activeSchema = source.schemaVersions.find((schema) => schema.isActive) ?? source.schemaVersions[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{source.name}</h1>
          <p className="text-sm text-muted-foreground">{source.description ?? "Aucune description."}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/uploads/new?sourceId=${source.id}`}>
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Uploader
            </Link>
          </Button>
          <DeleteSourceButton sourceId={source.id} />
        </div>
      </div>

      {activeSchema ? (
        <SourceForm
          initialSource={{
            id: source.id,
            externalId: source.externalId,
            name: source.name,
            description: source.description,
            ownerLabel: source.ownerLabel,
            schemaVersion: activeSchema.version,
            expectedFrequency: source.expectedFrequency,
            fileFormat: source.fileFormat === "xlsx" ? "xlsx" : "csv",
            delimiter: source.delimiter,
            encoding: source.encoding,
            hasHeader: source.hasHeader,
            rowConstraints: toRowConstraints(source.rowConstraints),
            columns: activeSchema.columns.map((column) => {
              const mapped = toDomainColumn(column);
              return {
                ...mapped,
                allowedValues: mapped.allowedValues ?? []
              };
            })
          }}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Historique des schemas</CardTitle>
          <CardDescription>Les versions anciennes restent consultables et rattachees aux uploads.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {source.schemaVersions.map((schema) => (
            <div key={schema.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Version {schema.version}</span>
                  {schema.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Archive</Badge>}
                </div>
                <span className="text-sm text-muted-foreground">{formatDate(schema.createdAt)}</span>
              </div>
              <Table className="mt-3">
                <TableHeader>
                  <TableRow>
                    <TableHead>Colonne</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contraintes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schema.columns.map((column) => (
                    <TableRow key={column.id}>
                      <TableCell className="font-medium">{column.name}</TableCell>
                      <TableCell>{column.type.toLowerCase()}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {[
                          column.required ? "required" : null,
                          column.dateFormat ? `format: ${column.dateFormat}` : null,
                          column.regex ? `regex: ${column.regex}` : null,
                          column.allowedValues.length ? `values: ${column.allowedValues.join(", ")}` : null,
                          column.min != null ? `min: ${column.min}` : null,
                          column.max != null ? `max: ${column.max}` : null,
                          column.minLength != null ? `min_length: ${column.minLength}` : null,
                          column.maxLength != null ? `max_length: ${column.maxLength}` : null
                        ]
                          .filter(Boolean)
                          .join(" | ") || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function toRowConstraints(value: unknown): RowConstraintDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      typeof item.name === "string"
    ) {
      return [
        {
          name: item.name,
          description:
            "description" in item && typeof item.description === "string" ? item.description : null
        }
      ];
    }

    return [];
  });
}
