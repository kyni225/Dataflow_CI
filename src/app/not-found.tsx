import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">La ressource demandee n&apos;existe pas.</p>
      </div>
      <Button asChild>
        <Link href="/">Retour au dashboard</Link>
      </Button>
    </div>
  );
}
