import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTenantBySubdomain } from "@/lib/redis-mock";
import { extractSubdomain } from "@/lib/subdomain";
import {
  TENANT_ID_HEADER,
  TENANT_NAME_HEADER,
  TENANT_SUBDOMAIN_HEADER,
} from "@/lib/tenant-headers";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    return new NextResponse("Unknown tenant subdomain", { status: 404 });
  }

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) {
    return new NextResponse("Unknown tenant subdomain", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_ID_HEADER, tenant.id);
  requestHeaders.set(TENANT_NAME_HEADER, tenant.name);
  requestHeaders.set(TENANT_SUBDOMAIN_HEADER, tenant.subdomain);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
