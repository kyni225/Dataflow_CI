import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadForm } from "@/features/uploads/components/upload-form";
import { requireUser } from "@/lib/session";
import { sourceService } from "@/services/source-service";

type PageProps = {
  searchParams: Promise<{ sourceId?: string }>;
};

export default async function NewUploadPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { sourceId } = await searchParams;
  const sources = await sourceService.list(user.id);

  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucune source disponible</CardTitle>
          <CardDescription>Un upload doit etre rattache a une source avec schema actif.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/sources/new">Creer une source</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <UploadForm
      sources={sources.map((source) => ({ id: source.id, name: source.name }))}
      initialSourceId={sourceId || undefined}
    />
  );
}
