/**
 * CanVas sync server — a deliberately "dumb" Yjs relay.
 *
 * It does NOT understand shapes or text. It only:
 *   1. accepts WebSocket connections scoped to a room (the URL path),
 *   2. keeps the authoritative Y.Doc per active room in memory,
 *   3. relays binary CRDT updates + awareness between peers.
 *
 * Persistence (snapshots to storage) is added in Phase 5 via setPersistence().
 * See docs/03-TECH.md §3 and docs/04-LOGIC.md §9.
 */
import http from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";

const host = process.env.HOST || "localhost";
const port = Number(process.env.PORT) || 1234;

const server = http.createServer((req, res) => {
  // Tiny health endpoint so hosts (Render, etc.) can ping us.
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("CanVas sync server: OK\n");
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, req) => {
  // The room name is the URL path, e.g. ws://host:1234/algorithms-week-3
  setupWSConnection(ws, req);
});

server.on("upgrade", (req, socket, head) => {
  // (Phase 7+: auth/rate-limit checks could go here.)
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

server.listen(port, host, () => {
  console.log(`CanVas sync server listening on ws://${host}:${port}`);
});
