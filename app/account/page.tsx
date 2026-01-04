"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function AccountPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setUsername(data.username || "");
      setDisplayName(data.display_name || "");
    };
    check();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to update password");
        return;
      }

      setSuccess("Password updated. Please log in again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => router.replace("/login"), 800);
    } finally {
      setLoading(false);
    }
  };

  const handleProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!displayName.trim()) {
      setProfileError("Display name is required");
      return;
    }

    if (displayName.trim().length > 12) {
      setProfileError("Display name must be 12 characters or less");
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setProfileError(data?.error || "Failed to update profile");
        return;
      }

      setProfileSuccess("Profile updated");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Change your password here. You will be logged out after updating.
        </p>
      </div>

      <Card className="card-sheen">
        <CardContent className="space-y-4">
          <div className="text-sm font-semibold">Profile</div>
          <form onSubmit={handleProfile} className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                User ID (read-only)
              </div>
              <Input
                value={username}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Display name (max 12)
              </div>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={12}
              />
            </div>
            {profileError && (
              <div className="text-sm text-destructive">{profileError}</div>
            )}
            {profileSuccess && (
              <div className="text-sm text-emerald-300">{profileSuccess}</div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="card-sheen">
        <CardContent className="space-y-4">
          <div className="text-sm font-semibold mt-3">Change password</div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            {success && (
              <div className="text-sm text-emerald-300">{success}</div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
