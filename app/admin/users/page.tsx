"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { UserPublic } from "@/types/db";

type UserRow = UserPublic & { created_at: string };

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createUsername, setCreateUsername] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("Failed to load users");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.replace("/login");
        return;
      }
      const me = await meRes.json();
      if (me.role !== "admin") {
        router.replace("/");
        return;
      }
      await loadUsers();
    };
    load();
  }, [router]);

  const startReset = (userId: string) => {
    setActiveUserId(userId);
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
    setShowResetPassword(false);
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setActiveUserId(null);
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
    setShowResetPassword(false);
    setShowResetConfirm(false);
  };

  const submitReset = async (userId: string) => {
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.error || "Failed to reset password");
        return;
      }
      setMessage("Password reset. Share it securely with the user.");
      setActiveUserId(null);
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateMessage(null);

    if (!createUsername.trim()) {
      setCreateMessage("Username is required");
      return;
    }
    if (!createDisplayName.trim()) {
      setCreateMessage("Display name is required");
      return;
    }
    if (createDisplayName.trim().length > 40) {
      setCreateMessage("Display name must be 40 characters or less");
      return;
    }
    if (createPassword.length < 8) {
      setCreateMessage("Password must be at least 8 characters");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: createUsername.trim(),
          display_name: createDisplayName.trim(),
          password: createPassword,
          role: createRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setCreateMessage(data?.error || "Failed to create user");
        return;
      }
      setCreateMessage("User created");
      setCreateUsername("");
      setCreateDisplayName("");
      setCreatePassword("");
      setCreateRole("user");
      setShowCreatePassword(false);
      await loadUsers();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    const ok = confirm(`Delete user "${username}"?`);
    if (!ok) return;
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.error || "Failed to delete user");
      return;
    }
    await loadUsers();
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Admin-only list of users. Use this to manage accounts.
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/")}>
          Back
        </Button>
      </div>

      <Card className="card-sheen">
        <CardContent className="space-y-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold mt-3"
            onClick={() => setCreateOpen((prev) => !prev)}
          >
            Create user
            <span className="text-muted-foreground">{createOpen ? "−" : "+"}</span>
          </button>
          {createOpen && (
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Username"
                  value={createUsername}
                  onChange={(event) => setCreateUsername(event.target.value)}
                  autoComplete="off"
                />
                <Input
                  placeholder="Display name (max 40)"
                  value={createDisplayName}
                  onChange={(event) => setCreateDisplayName(event.target.value)}
                  maxLength={40}
                />
              </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Temporary password"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                >
                  {showCreatePassword ? "Hide" : "Show"}
                </button>
              </div>
              <Select value={createRole} onChange={(event) => setCreateRole(event.target.value)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </Select>
            </div>
              {createMessage && <div className="text-sm text-muted-foreground">{createMessage}</div>}
              <div className="flex justify-end">
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create user"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading users...</div>
      )}

      {!loading && users.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No users found.
        </div>
      )}

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id} className="card-sheen">
            <CardContent className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">{user.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.username}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-0.5 uppercase">
                  {user.role}
                </span>
                {user.username === "system" && (
                  <span className="rounded-full border border-border px-2 py-0.5">
                    system
                  </span>
                )}
                <span>Since {formatDate(user.created_at)}</span>
              </div>
            </CardContent>
            <CardContent className="space-y-3 pt-0">
              {activeUserId === user.id ? (
                <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Reset password for {user.username}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="relative">
                    <Input
                      type={showResetPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                    >
                      {showResetPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showResetConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowResetConfirm((prev) => !prev)}
                    >
                      {showResetConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                  {message && (
                    <div className="text-sm text-muted-foreground">{message}</div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={cancelReset}>
                      Cancel
                    </Button>
                    <Button onClick={() => submitReset(user.id)} disabled={saving}>
                      {saving ? "Saving..." : "Reset password"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" onClick={() => startReset(user.id)}>
                    Reset password
                  </Button>
                  {user.username !== "system" && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(user.id, user.username)}
                    >
                      Delete user
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
