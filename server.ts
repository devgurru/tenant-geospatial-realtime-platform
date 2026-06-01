import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { getTenantBySubdomain } from "./src/lib/redis-mock";
import { extractSubdomain } from "./src/lib/subdomain";
import { tenantRoom } from "./src/lib/socket-tenant";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const SOCKET_PATH = "/api/socketio";

/** Per-tenant counter — isolated by Socket.io room. */
const countersByTenant = new Map<string, number>();

function getCounter(subdomain: string): number {
  return countersByTenant.get(subdomain) ?? 0;
}

function setCounter(subdomain: string, value: number): void {
  countersByTenant.set(subdomain, value);
}

async function resolveTenantSubdomain(
  host: string | undefined,
  queryTenant: unknown,
): Promise<string | null> {
  const fromHost = extractSubdomain(host ?? "");
  if (!fromHost) return null;

  if (typeof queryTenant === "string" && queryTenant.length > 0) {
    if (queryTenant.toLowerCase() !== fromHost.toLowerCase()) {
      return null;
    }
  }

  const tenant = await getTenantBySubdomain(fromHost);
  return tenant ? fromHost.toLowerCase() : null;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: SOCKET_PATH,
    addTrailingSlash: false,
  });

  io.on("connection", async (socket) => {
    const subdomain = await resolveTenantSubdomain(
      socket.handshake.headers.host,
      socket.handshake.query.tenant,
    );

    if (!subdomain) {
      socket.emit("counter:error", "Invalid or unknown tenant");
      socket.disconnect(true);
      return;
    }

    const room = tenantRoom(subdomain);
    await socket.join(room);

    socket.emit("counter:update", getCounter(subdomain));

    socket.on("counter:increment", () => {
      const next = getCounter(subdomain) + 1;
      setCounter(subdomain, next);
      io.to(room).emit("counter:update", next);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Socket.io path: ${SOCKET_PATH}`);
    console.log(`> Try tenant URL: http://acme.localhost:${port}`);
  });
});
