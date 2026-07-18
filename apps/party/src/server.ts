import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

/**
 * CanVas realtime sync — each PartyKit "room" is one CanVas room (the URL slug),
 * backed by its own Cloudflare Durable Object.
 *
 * `persist: { mode: "snapshot" }` snapshots the Yjs doc to Durable Object
 * storage, so a room survives with ZERO connected clients and across restarts /
 * redeploys — i.e. it's always alive (docs/03-TECH.md §3, upgraded from the
 * in-memory y-websocket relay).
 *
 * No auth by design: anyone who knows/guesses the room name joins it.
 */
export default class CanvasServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    return onConnect(conn, this.room, {
      persist: { mode: "snapshot" },
    });
  }

  // Tiny health endpoint (hosts / uptime pings hit the room over HTTP).
  onRequest() {
    return new Response("CanVas sync (PartyKit): OK\n");
  }
}

CanvasServer satisfies Party.Worker;
