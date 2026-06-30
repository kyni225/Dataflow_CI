"use client";

import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Une erreur est survenue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Reessayer
        </Button>
      </CardContent>
    </Card>
  );
}
