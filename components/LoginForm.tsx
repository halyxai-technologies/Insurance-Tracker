"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: f.get("username"),
          password: f.get("password"),
          remember: f.get("remember") === "on",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "Could not sign in");
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <div className="login-icon">
        <LockKeyhole size={20} />
      </div>
      <h2>Welcome back</h2>
      <p className="muted">Sign in to continue to your policy desk.</p>

      <label className="field">
        <span>Username</span>
        <input name="username" autoComplete="username" autoCapitalize="none" required autoFocus />
      </label>
      <label className="field">
        <span>Password</span>
        <div className="input-affix">
          <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required />
          <button type="button" className="affix-btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <label className="check">
        <input type="checkbox" name="remember" defaultChecked />
        <span>Keep me signed in on this device</span>
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? <Loader2 size={18} className="spin" /> : null}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
