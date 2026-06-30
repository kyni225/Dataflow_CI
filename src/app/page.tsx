import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, CheckCircle2, FileSpreadsheet, Plus, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import { requireUser } from "@/lib/session";
import { formatDate, formatPercent } from "@/lib/utils";
import { getDashboard } from "@/services/dashboard-service";

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring des uploads et de la qualite sur les 30 derniers jours.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/sources/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Source
            </Link>
          </Button>
          <Button asChild>
            <Link href="/uploads/new">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Fichiers"
          value={dashboard.totals.totalFiles}
          description="Uploads recus"
          icon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
        />
        <MetricCard
          title="Taux de succes"
          value={formatPercent(dashboard.totals.successRate)}
          description={`${dashboard.totals.successfulFiles} fichiers conformes`}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        />
        <MetricCard
          title="Taux d'erreur"
          value={formatPercent(dashboard.totals.errorRate)}
          description="Lignes invalides / lignes traitees"
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        />
        <MetricCard
          title="Volume"
          value={dashboard.totals.totalRows}
          description="Lignes traitees"
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
        />
      </div>

      {dashboard.totals.totalFiles === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucune donnee a afficher</CardTitle>
            <CardDescription>
              Creez une source puis envoyez un fichier de test pour alimenter les visualisations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/sources/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Creer une source
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DashboardCharts
          filesBySource={dashboard.filesBySource}
          volumeByDay={dashboard.volumeByDay}
          statusBreakdown={dashboard.statusBreakdown}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Derniers uploads</CardTitle>
          <CardDescription>Acces rapide aux rapports d&apos;ingestion recents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fichier</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Lignes</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.recentUploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell>
                    <Link className="font-medium text-primary hover:underline" href={`/uploads/${upload.id}`}>
                      {upload.originalFileName}
                    </Link>
                  </TableCell>
                  <TableCell>{upload.source.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={upload.status} />
                  </TableCell>
                  <TableCell>
                    {upload.validRows}/{upload.rowCount} valides
                  </TableCell>
                  <TableCell>{formatDate(upload.createdAt)}</TableCell>
                </TableRow>
              ))}
              {dashboard.recentUploads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucun upload pour le moment.
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

function MetricCard({
  title,
  value,
  description,
  icon
}: {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
