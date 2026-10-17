import { readScreenPass, releaseScreen } from "@/lib/server/screens";

// Beacon from a player page that is closing: frees its TV number right away so
// another screen can use it. The TV stays signed in, so reopening the link (or
// a reload) picks the slot back up if it's still free.
export async function POST(request: Request) {
  const pass = await readScreenPass();
  let instance = "";
  try {
    instance = String((JSON.parse(await request.text()) as { instance?: unknown }).instance ?? "");
  } catch {}
  // Without an instance id this can't tell a closing page from its reload.
  if (pass && instance) await releaseScreen(pass.slot, instance).catch(() => {});
  return new Response(null, { status: 204 });
}
