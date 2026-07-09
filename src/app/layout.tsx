import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { DatabaseZap, LogOut, Upload, Workflow } from "lucide-react";

import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/hooks/use-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataFlow CI",
  description: "Validation asynchrone de fichiers clients CSV et Excel.",
  icons: {
    icon: "/icon.svg"
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("[layout] auth() failed — check AUTH_SECRET, AUTH_URL, and database connectivity:", error);
  }

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <html lang="fr">
      <body>
        <ToastProvider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
              <div className="container flex h-14 items-center justify-between gap-4">
                <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
                  <DatabaseZap className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="truncate">DataFlow CI</span>
                </Link>

                {session?.user ? (
                  <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/sources">
                        <Workflow className="h-4 w-4" aria-hidden="true" />
                        Sources
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/uploads">
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        Uploads
                      </Link>
                    </Button>
                    <form action={logout}>
                      <Button variant="ghost" size="icon" title="Logout" aria-label="Logout">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </form>
                  </nav>
                ) : (
                  <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/register">Register</Link>
                    </Button>
                  </nav>
                )}
              </div>
            </header>
            <main className="container py-6">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
