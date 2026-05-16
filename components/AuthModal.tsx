"use client";

import { useState } from "react";

type User = {
  id: string;
  username: string | null;
  isGuest: boolean;
};

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
};

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAuthError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error ?? "Auth failed");
        setIsSubmitting(false);
        return;
      }

      setUsername("");
      setPassword("");
      setIsSubmitting(false);

      onAuthSuccess(data.user);
      onClose();
    } catch {
      setAuthError("Something went wrong. Try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              {authMode === "login" ? "Login" : "Create account"}
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              {authMode === "login"
                ? "Continue with your saved account."
                : "Save your progress across devices."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setAuthError(null);
            }}
            className={[
              "flex-1 rounded-xl px-4 py-2 font-bold transition",
              authMode === "login"
                ? "bg-white text-zinc-950"
                : "bg-zinc-900 text-white hover:bg-zinc-800",
            ].join(" ")}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setAuthError(null);
            }}
            className={[
              "flex-1 rounded-xl px-4 py-2 font-bold transition",
              authMode === "register"
                ? "bg-white text-zinc-950"
                : "bg-zinc-900 text-white hover:bg-zinc-800",
            ].join(" ")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            autoComplete="username"
            className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
          />

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            type="password"
            autoComplete={
              authMode === "login" ? "current-password" : "new-password"
            }
            className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-400"
          />

          {authError && (
            <p className="mb-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-white py-3 font-bold text-zinc-950 disabled:opacity-50"
          >
            {isSubmitting
              ? "Please wait..."
              : authMode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}