"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiPut } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { formatIDR } from "@/lib/format";
import type { PricingPlan } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface PlanDraft {
  id: PricingPlan["id"];
  name: string;
  price: string;
  period: string;
  description: string;
  dailyLimit: string;
  featuresText: string;
  highlighted: boolean;
}

function toDraft(plan: PricingPlan): PlanDraft {
  return {
    id: plan.id,
    name: plan.name,
    price: String(plan.price),
    period: plan.period,
    description: plan.description,
    dailyLimit: String(plan.dailyLimit),
    featuresText: plan.features.join("\n"),
    highlighted: plan.highlighted,
  };
}

function toPlan(draft: PlanDraft): PricingPlan {
  return {
    id: draft.id,
    name: draft.name.trim(),
    price: Number(draft.price) || 0,
    period: draft.period.trim(),
    description: draft.description.trim(),
    dailyLimit: Number(draft.dailyLimit) || 0,
    features: draft.featuresText.split("\n").filter(Boolean),
    highlighted: draft.highlighted,
  };
}

function PlanSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

export default function AdminPricingPage() {
  const { data, error, loading, refetch } =
    useApi<{ plans: PricingPlan[] }>("/pricing");

  const [drafts, setDrafts] = React.useState<PlanDraft[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (data) setDrafts(data.plans.map(toDraft));
  }, [data]);

  const updateDraft = (id: PricingPlan["id"], patch: Partial<PlanDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiPut("/admin/pricing", { plans: drafts.map(toPlan) });
      toast.success("Pricing diperbarui");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing"
        description="Atur paket dan fitur yang tampil di halaman pricing."
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PlanSkeleton />
          <PlanSkeleton />
        </div>
      ) : error || drafts.length === 0 ? (
        <EmptyState
          title="Gagal memuat pricing"
          description={error ?? "Data pricing tidak tersedia."}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {drafts.map((draft) => (
              <Card key={draft.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{draft.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Highlighted
                    </span>
                    <Switch
                      checked={draft.highlighted}
                      onCheckedChange={(checked) =>
                        updateDraft(draft.id, { highlighted: checked })
                      }
                      aria-label={`Highlight paket ${draft.name}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`plan-name-${draft.id}`}>Name</Label>
                    <Input
                      id={`plan-name-${draft.id}`}
                      value={draft.name}
                      onChange={(e) =>
                        updateDraft(draft.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`plan-price-${draft.id}`}>Price</Label>
                      <Input
                        id={`plan-price-${draft.id}`}
                        type="number"
                        min={0}
                        value={draft.price}
                        onChange={(e) =>
                          updateDraft(draft.id, { price: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatIDR(Number(draft.price) || 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`plan-period-${draft.id}`}>Period</Label>
                      <Input
                        id={`plan-period-${draft.id}`}
                        value={draft.period}
                        onChange={(e) =>
                          updateDraft(draft.id, { period: e.target.value })
                        }
                        placeholder="/bulan"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`plan-description-${draft.id}`}>
                      Description
                    </Label>
                    <Input
                      id={`plan-description-${draft.id}`}
                      value={draft.description}
                      onChange={(e) =>
                        updateDraft(draft.id, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`plan-limit-${draft.id}`}>
                      Daily Limit
                    </Label>
                    <Input
                      id={`plan-limit-${draft.id}`}
                      type="number"
                      min={0}
                      value={draft.dailyLimit}
                      onChange={(e) =>
                        updateDraft(draft.id, { dailyLimit: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`plan-features-${draft.id}`}>
                      Features
                    </Label>
                    <Textarea
                      id={`plan-features-${draft.id}`}
                      value={draft.featuresText}
                      onChange={(e) =>
                        updateDraft(draft.id, { featuresText: e.target.value })
                      }
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Satu fitur per baris.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
