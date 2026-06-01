import { headers } from "next/headers";
import { GeofenceChecker } from "@/components/GeofenceChecker";
import { RealtimeCounter } from "@/components/RealtimeCounter";
import { TenantBanner } from "@/components/TenantBanner";
import { TENANT_SUBDOMAIN_HEADER } from "@/lib/tenant-headers";

export default function Home() {
  const tenantSubdomain = headers().get(TENANT_SUBDOMAIN_HEADER) ?? "unknown";

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 font-[family-name:var(--font-geist-sans)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Lead Routing Demo
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Next.js 14 App Router — multi-tenant middleware, PostGIS geofence,
            Socket.io real-time updates.
          </p>
        </header>

        <TenantBanner />
        <GeofenceChecker />
        <RealtimeCounter tenantSubdomain={tenantSubdomain} />
      </div>
    </div>
  );
}
