"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminUserRow, ROLES, Role, SERVICES, Service, SessionUser, roleLabel, serviceLabel } from "@/lib/auth";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const inputClass = "rounded-[5px] border border-navy/20 px-3 py-2 font-normal";

export default function AdminPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    try {
      setUsers((await call<{ users: AdminUserRow[] }>("/api/admin/users")).users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    }
  }

  useEffect(() => {
    call<{ user: SessionUser | null }>("/api/auth/me").then((data) => setMe(data.user)).catch(() => {});
    call<{ users: AdminUserRow[] }>("/api/admin/users")
      .then((data) => setUsers(data.users))
      .catch((err: Error) => setError(err.message));
  }, []);

  function report(message: string, isError = false) {
    setError(isError ? message : "");
    setNotice(isError ? "" : message);
  }

  return (
    <section className="site-container grid gap-8 py-10">
      <div>
        <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">Rio Optima</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold text-navy">Admin console</h1>
        <p className="mt-2 text-muted">
          Add users and choose their role and service. Admins can open this console and see every user&apos;s SLIDER
          media in{" "}
          <Link href="/slider/manage" className="font-semibold text-teal hover:text-navy">
            Manage media
          </Link>
          .
        </p>
      </div>

      {error ? (
        <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="border border-teal/30 bg-teal/10 p-3 text-sm text-navy">
          {notice}
        </p>
      ) : null}

      <AddUserForm
        onAdded={(user) => {
          report(`Added ${user.name} (${roleLabel(user.role)}, ${serviceLabel(user.service)}).`);
          refresh();
        }}
        onError={(message) => report(message, true)}
      />

      <div>
        <h2 className="font-display text-xl font-bold text-navy">Users</h2>
        <div className="mt-3 overflow-x-auto border border-navy/10 bg-white">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">ID</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Service</th>
                <th className="px-3 py-3 font-semibold">Active</th>
                <th className="px-3 py-3 font-semibold">Media</th>
                <th className="px-3 py-3 font-semibold">Added</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users === null ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isMe={user.id === me?.id}
                    onChanged={(message) => {
                      report(message);
                      refresh();
                    }}
                    onError={(message) => report(message, true)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AddUserForm({ onAdded, onError }: { onAdded: (user: SessionUser) => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      const { user } = await call<{ user: SessionUser }>(
        "/api/admin/users",
        json("POST", {
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
          service: form.get("service"),
          active: form.get("active") === "yes",
        }),
      );
      formElement.reset();
      onAdded(user);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add the user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 border border-navy/10 bg-white p-6">
      <h2 className="font-display text-xl font-bold text-navy">Add new user</h2>
      <div className="grid items-start gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Name *
          <input name="name" required maxLength={80} className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Email *
          <input name="email" type="email" required autoComplete="off" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Password *
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          <span className="text-xs font-normal text-muted">At least 8 characters.</span>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Role *
          <select name="role" defaultValue="subscriber" className={inputClass}>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Service *
          <select name="service" defaultValue="slider" className={inputClass}>
            {SERVICES.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-navy">
          Active *
          <select name="active" defaultValue="yes" className={inputClass}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <div className="flex self-end md:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[5px] bg-navy px-5 py-2.5 text-sm font-bold text-white uppercase disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add user"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted">
        <strong className="text-navy">Active: No</strong> blocks login and the user&apos;s public player link.{" "}
        <strong className="text-navy">Admin</strong>: admin console, manages users, sees all uploaded media.{" "}
        <strong className="text-navy">Subscriber</strong>: manages only their own media.
      </p>
    </form>
  );
}

function UserRow({
  user,
  isMe,
  onChanged,
  onError,
}: {
  user: AdminUserRow;
  isMe: boolean;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [password, setPassword] = useState("");

  async function patch(
    body: Partial<{ role: Role; service: Service; password: string; active: boolean }>,
    message: string,
  ) {
    setBusy(true);
    try {
      await call(`/api/admin/users/${user.id}`, json("PATCH", body));
      onChanged(message);
      return true;
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not update the user.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const media = user.mediaCount
      ? ` Their ${user.mediaCount} media item${user.mediaCount === 1 ? "" : "s"} will stay in the playlist for admins to manage.`
      : "";
    if (!window.confirm(`Delete ${user.name}? They will no longer be able to log in.${media}`)) return;
    setBusy(true);
    try {
      await call(`/api/admin/users/${user.id}`, { method: "DELETE" });
      onChanged(`Deleted ${user.name}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not delete the user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t border-navy/10 align-top">
      <td className="px-3 py-3 text-navy">
        {user.name}
        {isMe ? <span className="ml-1 text-xs text-muted">(you)</span> : null}
      </td>
      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap text-navy">{user.shortId}</td>
      <td className="px-3 py-3">{user.email}</td>
      <td className="px-3 py-3">
        <select
          aria-label={`Role for ${user.name}`}
          value={user.role}
          disabled={busy || isMe}
          title={isMe ? "You can't change your own role." : undefined}
          onChange={(event) =>
            patch({ role: event.target.value as Role }, `${user.name} is now ${roleLabel(event.target.value as Role)}.`)
          }
          className="rounded-[5px] border border-navy/20 px-2 py-1"
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <select
          aria-label={`Service for ${user.name}`}
          value={user.service}
          disabled={busy}
          onChange={(event) =>
            patch(
              { service: event.target.value as Service },
              `${user.name}'s service is now ${serviceLabel(event.target.value as Service)}.`,
            )
          }
          className="rounded-[5px] border border-navy/20 px-2 py-1"
        >
          {SERVICES.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <select
          aria-label={`Active for ${user.name}`}
          value={user.active ? "yes" : "no"}
          disabled={busy || isMe}
          title={isMe ? "You can't deactivate your own account." : undefined}
          onChange={(event) => {
            const active = event.target.value === "yes";
            patch({ active }, `${user.name} is now ${active ? "active" : "inactive"}.`);
          }}
          className={`rounded-[5px] border px-2 py-1 ${user.active ? "border-navy/20" : "border-red-300 bg-red-50 text-red-800"}`}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </td>
      <td className="px-3 py-3">{user.mediaCount}</td>
      <td className="px-3 py-3 text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className="px-3 py-3">
        {settingPassword ? (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await patch({ password }, `Password updated for ${user.name}.`)) {
                setSettingPassword(false);
                setPassword("");
              }
            }}
          >
            <input
              type="password"
              aria-label={`New password for ${user.name}`}
              placeholder="New password"
              minLength={8}
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-36 rounded-[5px] border border-navy/20 px-2 py-1"
            />
            <button type="submit" disabled={busy} className="rounded-[5px] bg-navy px-3 py-1.5 text-xs font-bold text-white uppercase">
              Save
            </button>
            <button
              type="button"
              onClick={() => setSettingPassword(false)}
              className="px-2 py-1.5 text-xs font-semibold text-muted"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setSettingPassword(true)}
              className="rounded-[5px] bg-navy px-3 py-1.5 text-xs font-bold text-white uppercase"
            >
              Reset password
            </button>
            <button
              type="button"
              disabled={busy || isMe}
              title={isMe ? "You can't delete your own account." : undefined}
              onClick={remove}
              className="rounded-[5px] bg-teal px-3 py-1.5 text-xs font-bold text-white uppercase disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
