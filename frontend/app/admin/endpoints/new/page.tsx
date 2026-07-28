"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EndpointForm } from "@/components/admin/endpoint-form";

export default function NewEndpointPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Endpoint"
        description="Endpoint baru untuk katalog Topinz API."
      />
      <EndpointForm onSaved={() => router.push("/admin/endpoints")} />
    </div>
  );
}
