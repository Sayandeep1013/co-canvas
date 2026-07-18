import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";

export interface Env {
  Document: DurableObjectNamespace<Document>;
}

/**
 * CanVas realtime sync — each room slug is one Durable Object (kebab-cased
 * binding name "document" → the client provider's `party`).
 *
 * onLoad/onSave persist the Yjs doc to the DO's OWN storage, so a room survives
 * with zero connected clients and across restarts — i.e. always alive.
 *
 * No auth by design: anyone who knows/guesses the room name joins it.
 */
export class Document extends YServer<Env> {
  // Save a few seconds after edits, and when the room empties.
  static callbackOptions = {
    debounceWait: 2000,
    debounceMaxWait: 10000,
    timeout: 5000,
  };

  async onLoad() {
    const stored = await this.ctx.storage.get<Uint8Array>("doc");
    if (stored) Y.applyUpdate(this.document, stored);
  }

  async onSave() {
    await this.ctx.storage.put("doc", Y.encodeStateAsUpdate(this.document));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("CanVas sync (partyserver): OK\n", { status: 200 })
    );
  },
} satisfies ExportedHandler<Env>;
