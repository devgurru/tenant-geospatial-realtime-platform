import { headers } from "next/headers";
import {
  INVALID_TENANT_EXAMPLES,
  listValidTenantUrls,
} from "@/lib/tenant-urls";
import {
  TENANT_ID_HEADER,
  TENANT_NAME_HEADER,
  TENANT_SUBDOMAIN_HEADER,
} from "@/lib/tenant-headers";

export function TenantBanner() {
  const headerList = headers();
  const tenantId = headerList.get(TENANT_ID_HEADER);
  const tenantName = headerList.get(TENANT_NAME_HEADER);
  const subdomain = headerList.get(TENANT_SUBDOMAIN_HEADER);
  const validUrls = listValidTenantUrls();

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="text-lg font-semibold text-emerald-950">
        1. Multi-tenant middleware
      </h2>
      <p className="mt-1 text-sm text-emerald-900">
        Subdomain resolved from Host, looked up in mock Redis, injected as
        request headers. Unknown subdomains receive HTTP 404.
      </p>
      {tenantId ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-medium text-emerald-950">Tenant ID</dt>
            <dd className="font-mono text-emerald-900">{tenantId}</dd>
          </div>
          <div>
            <dt className="font-medium text-emerald-950">Name</dt>
            <dd className="text-emerald-900">{tenantName}</dd>
          </div>
          <div>
            <dt className="font-medium text-emerald-950">Subdomain</dt>
            <dd className="font-mono text-emerald-900">{subdomain}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-emerald-900">
          No tenant headers (you should not see this on a valid tenant host).
        </p>
      )}

      <div className="mt-4">
        <p className="text-sm font-medium text-emerald-950">
          Valid tenant URLs (open in browser):
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {validUrls.map((url) => (
            <li key={url}>
              <a
                href={url}
                className="font-mono text-emerald-800 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-950"
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-emerald-950">
          Should return 404:
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-emerald-900">
          {INVALID_TENANT_EXAMPLES.map(({ url, reason }) => (
            <li key={url}>
              <a
                href={url}
                className="font-mono text-emerald-800 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-950"
              >
                {url}
              </a>
              <span className="text-emerald-800"> — {reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
