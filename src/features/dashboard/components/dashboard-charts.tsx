"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardChartsProps = {
  filesBySource: Array<{ name: string; files: number; rows: number }>;
  volumeByDay: Array<{ date: string; files: number; validRows: number; invalidRows: number }>;
  statusBreakdown: Array<{ name: string; value: number }>;
};

const statusColors = ["#059669", "#f59e0b", "#dc2626", "#0284c7"];

export function DashboardCharts({
  filesBySource,
  volumeByDay,
  statusBreakdown
}: DashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Fichiers par source</CardTitle>
          <CardDescription>Repere rapidement les partenaires les plus actifs.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filesBySource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="files" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualite des uploads</CardTitle>
          <CardDescription>Repartition des statuts sur les 30 derniers jours.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
              >
                {statusBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Volume traite par jour</CardTitle>
          <CardDescription>Lignes valides et invalides pour suivre la derive de qualite.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volumeByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="validRows" stroke="#059669" strokeWidth={2} />
              <Line type="monotone" dataKey="invalidRows" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
