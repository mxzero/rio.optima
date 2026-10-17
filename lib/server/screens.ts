// Which TVs are playing each account's media right now.
//
// Signing in at /sfs/<code> claims a slot: a record of (account, TV number)
// with the time it was last seen. TV numbers run from 1 to the account's Total
// TV, and each plays on one screen at a time (checked under the store's write
// lock), so an account never plays on more than Total TV screens.
//
// How a slot is known to be free again:
//   - The player is closed (tab, window or browser): the page sends a release
//     beacon as it goes away, which frees the slot at once.
//   - The TV is switched off, crashes or loses its connection, so no beacon is
//     sent: a playing page checks in every HEARTBEAT_SECONDS, and a slot that
//     hasn't checked in for SLOT_EXPIRES_MS is free.
// Check-ins are spaced out because each one that renews a slot rewrites the
// screens collection (on Vercel Blob, an upload billed as an Advanced
// Operation). A check-in or page render within RENEW_AFTER_MS of the last
// renewal changes nothing, so it writes nothing.
// Each page load has its own instance id, which the beacon carries, so the
// beacon from a page being reloaded can't free the slot its replacement just
// picked up.
// The browser keeps its slot id in a signed cookie, so a reload or a brief
// outage picks the same slot back up without signing in again.

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ALL_TV, SCREEN_COOKIE, SessionUser, canUseSlider, tvLabel } from "@/lib/auth";
import { openJson, sealJson } from "@/lib/server/session";
import { collection } from "@/lib/server/store";
import { findUserById } from "@/lib/server/users";

export const HEARTBEAT_SECONDS = 60;
// Two and a half check-ins, so one late or missed check-in doesn't lose the
// slot. Browsers slow timers in hidden tabs (to once a minute), so a player
// left in a background tab can still lose its slot; it takes it back (if still
// free) when shown again.
const SLOT_EXPIRES_MS = 150_000;
// Shorter than HEARTBEAT_SECONDS, so every timed check-in renews the slot.
const RENEW_AFTER_MS = 45_000;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type Screen = {
  id: string;
  userId: string;
  tv: number;
  startedAt: number;
  lastSeen: number;
  // The page load that last checked in.
  instance?: string;
};
// What the TV's cookie holds.
type ScreenPass = { slot: string; userId: string; tv: number };

const screens = collection<Screen>("screens", async () => []);

export class ScreenBusyError extends Error {
  constructor(
    message: string,
    readonly reason: "limit" | "taken",
  ) {
    super(message);
  }
}

const plural = (count: number) => `${count} TV${count === 1 ? "" : "s"}`;
const FREES_UP = `Closing the player on that screen frees it right away; a TV that was switched off or lost its connection frees up within ${SLOT_EXPIRES_MS / 60_000} minutes.`;

// Claims a slot for this account's TV, or renews the one given (with the page
// load checking in, if any). Throws ScreenBusyError when the TV number is
// taken or past the account's Total TV (say an admin lowered it: TVs above the
// new total stop at their next check-in).
export async function claimScreen(owner: SessionUser, tv: number, slotId?: string, instance?: string) {
  const id = slotId ?? crypto.randomUUID();
  // Set inside update(), which may run more than once.
  const outcome: { busy: ScreenBusyError | null } = { busy: null };
  await screens.update((records) => {
    outcome.busy = null;
    const now = Date.now();
    for (const [key, screen] of Object.entries(records)) {
      if (now - screen.lastSeen > SLOT_EXPIRES_MS) delete records[key];
    }
    const mine = records[id]?.userId === owner.id ? records[id] : undefined;
    if (tv > owner.totalTvs) {
      if (mine) delete records[id];
      outcome.busy = new ScreenBusyError(
        `This account has ${plural(owner.totalTvs)}. Choose a TV number from 1 to ${owner.totalTvs}.`,
        "limit",
      );
      return;
    }
    const inUse = new Set(
      Object.values(records)
        .filter((screen) => screen.userId === owner.id && screen.id !== id)
        .map((screen) => screen.tv),
    );
    if (inUse.has(tv)) {
      const free = Array.from({ length: owner.totalTvs }, (_, index) => index + 1).filter((number) => !inUse.has(number));
      outcome.busy = free.length
        ? new ScreenBusyError(
            `${tvLabel(tv)} is playing on another screen right now. Free now: ${free.map(tvLabel).join(", ")}. ${FREES_UP}`,
            "taken",
          )
        : new ScreenBusyError(
            `${owner.totalTvs === 1 ? "This account's only TV is" : `All ${plural(owner.totalTvs)} on this account are`} playing right now. ${FREES_UP} Or ask an admin to raise the Total TV.`,
            "limit",
          );
      return;
    }
    // Renewed moments ago by this page load (or a render of it): leave as is.
    const sameLoad = !instance || instance === mine?.instance;
    if (mine?.tv === tv && sameLoad && now - mine.lastSeen < RENEW_AFTER_MS) return;
    records[id] = {
      id,
      userId: owner.id,
      tv,
      startedAt: mine?.tv === tv ? mine.startedAt : now,
      lastSeen: now,
      instance: instance ?? mine?.instance,
    };
  });
  if (outcome.busy) throw outcome.busy;
  return id;
}

// Frees a slot. With `instance` (a closing page's release beacon), only while
// that page load is still the one holding it.
export async function releaseScreen(slotId: string, instance?: string) {
  await screens.update((records) => {
    const held = records[slotId]?.instance;
    if (!instance || !held || held === instance) delete records[slotId];
  });
}

export async function readScreenPass(): Promise<ScreenPass | null> {
  const pass = await openJson<Omit<ScreenPass, "tv"> & { tv: unknown }>(
    "screen",
    (await cookies()).get(SCREEN_COOKIE)?.value,
  );
  // TVs signed in as "All" before TV numbers replaced it are TV 1 now.
  return pass ? { ...pass, tv: typeof pass.tv === "number" ? pass.tv : ALL_TV } : null;
}

export async function setScreenCookie(response: NextResponse, pass: ScreenPass) {
  response.cookies.set(SCREEN_COOKIE, await sealJson("screen", pass), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

// For /sfs/<code>: if this browser is a TV of `owner`, renews its slot and
// returns its TV number, or why it can't play now. Null when it isn't one.
export async function resumeScreen(owner: SessionUser): Promise<{ tv: number; busy?: ScreenBusyError } | null> {
  const pass = await readScreenPass();
  if (!pass || pass.userId !== owner.id) return null;
  try {
    await claimScreen(owner, pass.tv, pass.slot);
    return { tv: pass.tv };
  } catch (error) {
    if (error instanceof ScreenBusyError) return { tv: pass.tv, busy: error };
    throw error;
  }
}

// The account a signed-in TV plays for, while it may still play SLIDER.
export async function screenOwner() {
  const pass = await readScreenPass();
  const owner = pass ? await findUserById(pass.userId) : null;
  return canUseSlider(owner) ? owner : null;
}
