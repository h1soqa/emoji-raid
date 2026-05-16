"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/AuthModal";

type Boss = {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  currentHp: number;
  date: string;
};

type SpinResult = {
  symbols: string[];
  damage: number;
  boss: Boss;
};

type Spin = {
  id: string;
  userId: string;
  bossId: string;
  date: string;
  symbols: string;
  damage: number;
  createdAt: string;
};

type TodayStatus = {
  canSpin: boolean;
  spin: Spin | null;
  boss: Boss;
};

type User = {
  id: string;
  username: string | null;
  isGuest: boolean;
};

const reelSymbols = ["🍒", "🔥", "💀", "⭐", "🍀", "🧊", "❤️"];

function getRandomSymbols() {
  return Array.from({ length: 3 }, () => {
    const index = Math.floor(Math.random() * reelSymbols.length);
    return reelSymbols[index];
  });
}

export default function Home() {
  const [boss, setBoss] = useState<Boss | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [todaySpin, setTodaySpin] = useState<Spin | null>(null);
  const [displayedSymbols, setDisplayedSymbols] = useState<string[]>([
    "❔",
    "❔",
    "❔",
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [damagePopup, setDamagePopup] = useState<number | null>(null);
  const [isBossHit, setIsBossHit] = useState(false);

  const [user, setUser] = useState<User | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  async function loadTodayStatus() {
    const response = await fetch("/api/me/today");
    const data: TodayStatus & { user: User | null } = await response.json();

    setUser(data.user);
    setBoss(data.boss);
    setCanSpin(data.canSpin);
    setTodaySpin(data.spin);

    if (data.spin) {
      setDisplayedSymbols(data.spin.symbols.split(","));
    }
  }

  async function ensureGuestSession() {
    const response = await fetch("/api/auth/guest", {
      method: "POST",
    });

    if (response.status === 401) {
      setUser(null);
      return;
    }

    const data = await response.json();

    if (response.ok) {
      setUser(data.user);
    }
  }

  async function handleSpin() {
    if (!user) {
      setError("Login first");
      return;
    }

    setError(null);
    setResult(null);

    const statusResponse = await fetch("/api/me/today");
    const statusData: TodayStatus = await statusResponse.json();

    setBoss(statusData.boss);
    setCanSpin(statusData.canSpin);
    setTodaySpin(statusData.spin);

    if (!statusData.canSpin) {
      if (statusData.spin) {
        setDisplayedSymbols(statusData.spin.symbols.split(","));
      }

      setError("You have already played today");
      return;
    }

    setIsSpinning(true);

    const animationInterval = window.setInterval(() => {
      setDisplayedSymbols(getRandomSymbols());
    }, 80);

    try {
      const response = await fetch("/api/spin", {
        method: "POST",
      });

      const data = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 1200));

      window.clearInterval(animationInterval);

      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        setIsSpinning(false);
        await loadTodayStatus();
        return;
      }

      setDisplayedSymbols(data.symbols);
      setResult(data);
      setBoss(data.boss);
      setCanSpin(false);
      setTodaySpin(data.spin);
      setIsSpinning(false);

      setDamagePopup(data.damage);
      setIsBossHit(true);

      window.setTimeout(() => {
        setDamagePopup(null);
      }, 1400);

      window.setTimeout(() => {
        setIsBossHit(false);
      }, 500);
    } catch {
      window.clearInterval(animationInterval);
      setError("Failed to spin. Try again.");
      setIsSpinning(false);
    }
  }

  async function handleAuthSuccess(authUser: User) {
    setUser(authUser);
    await loadTodayStatus();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    setCanSpin(false);
    setTodaySpin(null);
    setResult(null);
    setDisplayedSymbols(["❔", "❔", "❔"]);

    await loadTodayStatus();
  }

  useEffect(() => {
    async function init() {
      await ensureGuestSession();
      await loadTodayStatus();
    }

    init();
  }, []);

  const hpPercent = boss
    ? Math.max(0, Math.round((boss.currentHp / boss.maxHp) * 100))
    : 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl bg-zinc-900 p-8 shadow-2xl border border-zinc-800">
        <h1 className="text-3xl font-bold mb-2">Emoji Raid</h1>

        <p className="text-zinc-400 mb-8">
          Один spin в день. Весь урон игроков идет в общего босса.
        </p>

        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div>
            <p className="text-sm text-zinc-400">
              {!user
                ? "Not logged in"
                : user.isGuest
                  ? "Playing as guest"
                  : "Logged in as"}
            </p>

            <p className="font-bold">
              {!user
                ? "Login to continue"
                : user.isGuest
                  ? "Guest player"
                  : `@${user.username}`}
            </p>
          </div>

          <div className="flex gap-2">
            {(!user || user.isGuest) && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-zinc-200"
              >
                {user?.isGuest ? "Save progress" : "Login"}
              </button>
            )}

            {user && !user.isGuest && (
              <button
                onClick={handleLogout}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {boss ? (
          <section
            className={[
              "mb-8 rounded-3xl border border-zinc-800 p-6 text-center transition-all duration-300",
              "bg-zinc-950/40",
              isBossHit
                ? "animate-boss-flash border-red-400/60 shadow-2xl shadow-red-950/50"
                : "",
            ].join(" ")}
          >
            <div
              className={[
                "text-7xl mb-4 inline-block transition-transform",
                isBossHit ? "animate-boss-shake" : "",
              ].join(" ")}
            >
              <img src="/straj_dreva.webp" width="250px"/>
            </div>

            <h2 className="text-2xl font-bold">Страж древа</h2>

            <p className="text-zinc-400 mb-4">
              HP: {boss.currentHp} / {boss.maxHp}
            </p>

            <div className="relative">
              {damagePopup !== null && (
                <div className="pointer-events-none absolute right-2 -top-10 z-10 animate-damage-pop rounded-full border border-red-400/40 bg-red-500/20 px-4 py-2 text-lg font-black text-red-200 shadow-lg shadow-red-950/40">
                  -{damagePopup} HP
                </div>
              )}

              <div className="h-4 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-700"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </section>
        ) : (
          <p>Loading boss...</p>
        )}

        <section className="mb-8 grid grid-cols-3 gap-4">
          {displayedSymbols.map((symbol, index) => (
            <div
              key={index}
              className={[
                "aspect-square rounded-3xl bg-zinc-800 border border-zinc-700",
                "flex items-center justify-center text-6xl shadow-inner",
                "transition-transform duration-100",
                isSpinning ? "scale-105 animate-pulse" : "scale-100",
              ].join(" ")}
            >
              {symbol}
            </div>
          ))}
        </section>

        <button
          onClick={handleSpin}
          disabled={isSpinning || !boss || !canSpin || !user}
          className="w-full rounded-2xl bg-white text-zinc-950 font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
        >
          {isSpinning
            ? "Spinning..."
            : !user
              ? "Login to spin"
              : canSpin
                ? "Spin"
                : "Already played today"}
        </button>

        {todaySpin && !result && (
          <section className="mt-8 rounded-2xl bg-zinc-800 p-6 text-center">
            <p className="text-zinc-400 mb-2">Today&apos;s attack</p>

            <div className="text-5xl mb-4 tracking-widest">
              {todaySpin.symbols.split(",").join(" ")}
            </div>

            <p className="text-2xl font-bold">
              Damage: {todaySpin.damage}
            </p>
          </section>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 text-red-300 p-4">
            {error}
          </p>
        )}

        {result && (
          <section className="mt-8 rounded-2xl bg-zinc-800 p-6 text-center">
            <p className="text-zinc-400 mb-2">Your attack</p>

            <div className="text-5xl mb-4 tracking-widest">
              {result.symbols.join(" ")}
            </div>

            <p className="text-2xl font-bold">
              Damage: {result.damage}
            </p>
          </section>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}
