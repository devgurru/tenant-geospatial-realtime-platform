import { listKnownSubdomains } from "@/lib/redis-mock";

const DEFAULT_PORT = Number(process.env.PORT ?? 3000);

/** Build a tenant URL for local subdomain testing. */
export function tenantUrl(subdomain: string, port = DEFAULT_PORT): string {
  return `http://${subdomain}.localhost:${port}`;
}

export function listValidTenantUrls(port = DEFAULT_PORT): string[] {
  return listKnownSubdomains().map((sub) => tenantUrl(sub, port));
}

export const INVALID_TENANT_EXAMPLES = [
  { url: tenantUrl("unknown"), reason: "Subdomain not in mock Redis" },
  { url: `http://localhost:${DEFAULT_PORT}`, reason: "No subdomain on host" },
] as const;
