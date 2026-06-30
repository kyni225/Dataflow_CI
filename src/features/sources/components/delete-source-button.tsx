"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function DeleteSourceButton({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  async function deleteSource() {
    setLoading(true);
    try {
      const response = await fetch(`/api/sources/${sourceId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Suppression impossible.");
      }

      toast({ title: "Source supprimee" });
      router.push("/sources");
      router.refresh();
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inattendue.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)} disabled={loading}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Supprimer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogClose onClick={() => setOpen(false)} />
          <DialogHeader>
            <DialogTitle>Supprimer la source</DialogTitle>
            <DialogDescription>
              Cette action supprime la source, ses versions de schema, uploads, erreurs et lignes valides.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={deleteSource} disabled={loading}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
