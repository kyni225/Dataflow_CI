"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Deconnexion</CardTitle>
          <CardDescription>Fermeture de la session en cours.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Redirection vers la page de connexion...
        </CardContent>
      </Card>
    </div>
  );
}
