import Link from "next/link";
import { Plus, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { sourceService } from "@/services/source-service";

export default async function SourcesPage() {
  const user = await requireUser();
  const sources = await sourceService.list(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Fournisseurs de donnees et schemas versionnes associes.
          </p>
        </div>
        <Button asChild>
          <Link href="/sources/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle source
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue</CardTitle>
          <CardDescription>Chaque source peut evoluer sans ecraser les anciennes versions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Schema actif</TableHead>
                <TableHead>Uploads</TableHead>
                <TableHead>Creation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => {
                const active = source.schemaVersions[0];
                return (
                  <TableRow key={source.id}>
                    <TableCell>
                      <Link className="font-medium text-primary hover:underline" href={`/sources/${source.id}`}>
                        {source.name}
                      </Link>
                      {source.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {source.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {active ? (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary">v{active.version}</Badge>
                          <Badge>{active.columns.length} colonnes</Badge>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{source._count.uploads}</TableCell>
                    <TableCell>{formatDate(source.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
              {sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    <Workflow className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Aucune source. Commencez par definir un schema.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
