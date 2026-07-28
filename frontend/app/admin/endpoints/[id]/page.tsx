"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiDelete } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { ApiEndpoint } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { EndpointForm } from "@/components/admin/endpoint-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EditEndpointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  // GET /endpoint/:id (admin) → data: { endpoint: ApiEndpoint }.
  const {
    data: fetched,
    error,
    loading,
    refetch,
  } = useApi<{ endpoint: ApiEndpoint }>(`/endpoint/${id}`);
  const data = fetched?.endpoint ?? null;
  const [deleting, setDeleting] = React.useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/endpoint/${id}`);
      toast.success("Endpoint dihapus");
      router.push("/admin/endpoints");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Terjadi kesalahan");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Endpoint"
        description={data ? data.name : "Perbarui detail endpoint."}
        actions={
          data ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 />
                  Hapus Endpoint
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus endpoint?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Endpoint{" "}
                    <span className="font-medium text-foreground">
                      {data.name}
                    </span>{" "}
                    beserta dokumentasinya akan dihapus permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                    onClick={(e) => {
                      e.preventDefault();
                      void confirmDelete();
                    }}
                  >
                    {deleting ? <Loader2 className="animate-spin" /> : null}
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null
        }
      />

      {loading ? (
        <FormSkeleton />
      ) : error || !data ? (
        <EmptyState
          title="Endpoint tidak ditemukan"
          description={error ?? "Endpoint mungkin sudah dihapus."}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/endpoints")}
              >
                Kembali
              </Button>
              <Button size="sm" onClick={() => void refetch()}>
                Coba lagi
              </Button>
            </div>
          }
        />
      ) : (
        <EndpointForm
          initial={data}
          onSaved={() => router.push("/admin/endpoints")}
        />
      )}
    </div>
  );
}
