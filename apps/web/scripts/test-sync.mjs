// Phase 0 headless proof: two independent Y.Docs connected to the running sync
// server must converge. Run: node scripts/test-sync.mjs  (from apps/web)
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// Node 22 has a native global WebSocket, so no polyfill needed.
const URL = process.env.NEXT_PUBLIC_SYNC_URL || "ws://localhost:1234";
const ROOM = "phase0-headless-" + Math.random().toString(36).slice(2, 8);

const docA = new Y.Doc();
const docB = new Y.Doc();
const a = new WebsocketProvider(URL, ROOM, docA);
const b = new WebsocketProvider(URL, ROOM, docB);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await wait(800); // let both connect
  docA.getText("t").insert(0, "hello from A");
  await wait(200);
  docB.getText("t").insert(docB.getText("t").length, " + B");
  await wait(600); // let them converge

  const A = docA.getText("t").toString();
  const B = docB.getText("t").toString();
  console.log("docA sees:", JSON.stringify(A));
  console.log("docB sees:", JSON.stringify(B));
  const converged = A === B && A.includes("hello from A") && A.includes("+ B");
  console.log(converged ? "PASS: converged" : "FAIL: diverged");

  a.destroy();
  b.destroy();
  process.exit(converged ? 0 : 1);
}
main();
