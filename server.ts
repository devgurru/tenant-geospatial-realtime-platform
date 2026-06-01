import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const SOCKET_PATH = "/api/socketio";

let counter = 0;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: SOCKET_PATH,
    addTrailingSlash: false,
  });

  io.on("connection", (socket) => {
    socket.emit("counter:update", counter);

    socket.on("counter:increment", () => {
      counter += 1;
      io.emit("counter:update", counter);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Socket.io path: ${SOCKET_PATH}`);
    console.log(`> Try tenant URL: http://acme.localhost:${port}`);
  });
});
