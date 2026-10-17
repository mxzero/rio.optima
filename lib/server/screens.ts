// Which TVs are playing each account's media right now.
//
// Signing in at /sfs/<code> claims a slot: a record of (account, TV number)
// with the time it was last seen. The TV keeps it by checking in every
// HEARTBEAT_SECONDS; a slot nobody has checked in on for SLOT_EXPIRES_MS is
// free again (the TV was turned off, closed, or lost its connection).
// Claims follow two rules, checked together under the store's write lock:
//   - a TV number plays on one screen at a time;
//   - an account plays on at most Total TV screens at once ("All" counts too).
// The browser keeps its slot id in a signed cookie, so a reload or a brief
// outage picks the same slot back up without signing in again.

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SCREEN_COOKIE, SessionUser, TvChoice, canUseSlider, tvLabel } from "@/lib/auth";
import { openJson, sealJson } from "@/lib/server/session";
import { collection } from "@/lib/server/store";
import { findUserById } from "@/lib/server/users";

export const HEARTBEAT_SECONDS = 30;
const SLOT_EXPIRES_MS = 75_000;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type Screen = { id: string; userId: string; tv: TvChoice; startedAt: number; lastSeen: number };
// What the TV's cookie holds.
type ScreenPass = { slot: string; userId: string; tv: TvChoice };

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

// Claims a slot for this account's TV, or renews the one given. Throws
// ScreenBusyError when the TV number or the account's Total TV is used up.
// If an admin lowers Total TV, the screens that started first keep playing.
export async function claimScreen(owner: SessionUser, tv: TvChoice, slotId?: string) {
  const id = slotId ?? crypto.randomUUID();
  const fits = (choice: TvChoice) => choice === "all" || choice <= owner.totalTvs;
  // Set inside update(), which may run more than once.
  const outcome: { busy: ScreenBusyError | null } = { busy: null };
  await screens.update((records) => {
    outcome.busy = null;
    const now = Date.now();
    for (const [key, screen] of Object.entries(records)) {
      if (now - screen.lastSeen > SLOT_EXPIRES_MS) delete records[key];
    }
    const mine = records[id]?.userId === owner.id ? records[id] : undefined;
    if (!fits(tv)) {
      if (mine) delete records[id];
      outcome.busy = new ScreenBusyError(
        `This account has ${plural(owner.totalTvs)}. Choose All or a TV number from 1 to ${owner.totalTvs}.`,
        "limit",
      );
      return;
    }
    // Screens on a TV number that no longer fits are on their way out.
    const others = Object.values(records).filter(
      (screen) => screen.userId === owner.id && screen.id !== id && fits(screen.tv),
    );
    if (tv !== "all" && others.some((screen) => screen.tv === tv)) {
      outcome.busy = new ScreenBusyError(
        `${tvLabel(tv)} is already playing on another screen. Choose another TV number, or turn that screen off first (its spot frees up about a minute later).`,
        "taken",
      );
      return;
    }
    const startedAt = mine?.tv === tv ? mine.startedAt : now;
    const ahead = others.filter((screen) => screen.startedAt <= startedAt);
    if (ahead.length >= owner.totalTvs) {
      if (mine) delete records[id];
      outcome.busy = new ScreenBusyError(
        `This account can play on ${plural(owner.totalTvs)} at once, and ${ahead.length === 1 ? "it is" : `all ${ahead.length} are`} already in use. Turn one off first (its spot frees up about a minute later), or ask an admin to raise the Total TV.`,
        "limit",
      );
      return;
    }
    records[id] = { id, userId: owner.id, tv, startedAt, lastSeen: now };
  });
  if (outcome.busy) throw outcome.busy;
  return id;
}

export async function releaseScreen(slotId: string) {
  await screens.update((records) => {
    delete records[slotId];
  });
}

export async function readScreenPass() {
  return openJson<ScreenPass>("screen", (await cookies()).get(SCREEN_COOKIE)?.value);
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
export async function resumeScreen(owner: SessionUser): Promise<{ tv: TvChoice; busy?: ScreenBusyError } | null> {
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
