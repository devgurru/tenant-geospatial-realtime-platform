const ROOT_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Extracts tenant subdomain from the Host header.
 * Examples: acme.localhost:3000 → acme, globex.example.com → globex
 */
export function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname || ROOT_HOSTS.has(hostname)) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length < 2) {
    return null;
  }

  // acme.localhost or acme.dev.example.com → first label is the tenant subdomain
  const subdomain = parts[0];
  if (!subdomain || subdomain === "www") {
    return null;
  }

  return subdomain;
}
