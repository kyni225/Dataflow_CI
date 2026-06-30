"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Creation de compte impossible.");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        throw new Error("Email ou mot de passe invalide.");
      }

      toast({
        title: mode === "register" ? "Compte cree" : "Connexion reussie",
        description: "Bienvenue dans DataFlow CI."
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      toast({
        title: "Action impossible",
        description: error instanceof Error ? error.message : "Erreur inattendue.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{isRegister ? "Creer un compte" : "Connexion"}</CardTitle>
          <CardDescription>
            {isRegister
              ? "Initialisez votre espace de validation DataFlow CI."
              : "Accedez au dashboard de monitoring et aux rapports."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {isRegister ? (
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isRegister ? "Creer le compte" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isRegister ? "Deja inscrit ?" : "Pas encore de compte ?"}{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Se connecter" : "S'inscrire"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
