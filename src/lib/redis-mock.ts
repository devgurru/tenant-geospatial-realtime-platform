/**
 * In-memory mock of Redis GET for tenant lookup.
 * Key format: tenant:{subdomain}
 */
export type TenantRecord = {
  id: string;
  name: string;
  subdomain: string;
};

const TENANTS: Record<string, TenantRecord> = {
  acme: { id: "tenant_acme", name: "Acme Corp", subdomain: "acme" },
  globex: { id: "tenant_globex", name: "Globex Inc", subdomain: "globex" },
  initech: { id: "tenant_initech", name: "Initech", subdomain: "initech" },
};

/** Simulates Redis GET for key `tenant:{subdomain}` — async to mirror real I/O. */
export async function getTenantBySubdomain(
  subdomain: string,
): Promise<TenantRecord | null> {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return TENANTS[subdomain.toLowerCase()] ?? null;
}

export function listKnownSubdomains(): string[] {
  return Object.keys(TENANTS);
}
