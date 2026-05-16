"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import Link from "next/link";
import Image from "next/image";

type Boss = {
  id: string;
  name: string;
  emoji: string | null;
  imageUrl: string | null;
  maxHp: number;
  currentHp: number;
  date: string;

  castleMaxHp: number;
  castleDamagePerMin: number;
  castleCurrentHp: number;
  castleImageUrl: string | null;

  computedStatus: "active" | "won" | "lost";
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
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Emoji Raid</h1>
            <p className="text-sm text-zinc-400">
              One spin per day. Defend the castle.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Link
              href="/leaderboard"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-2 text-sm font-bold hover:bg-zinc-800 sm:flex-none"
            >
              Leaderboard
            </Link>

            <div className="flex-1 flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 sm:flex-none">
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
          </div>
        </header>
        
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
          {boss && boss.computedStatus !== "active" && (
            <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-center">
              <p className="text-xl font-black">
                {boss.computedStatus === "won"
                  ? "Victory! Boss defeated."
                  : "Defeat. The castle has fallen."}
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
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
                    "text-7xl mb-4 inline-block transition-transform overflow-hidden rounded-3xl",
                    isBossHit ? "animate-boss-shake" : "",
                  ].join(" ")}
                >
                  {/* {boss.imageUrl ? (
                    <Image
                      src={boss.imageUrl}
                      alt={boss.name}
                      width={250}
                      height={250}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-7xl">{boss.emoji ?? "👹"}</span>
                  )} */}
                  <Image
                      src="/images/straj_dreva.webp"
                      alt={boss.name}
                      width={250}
                      height={250}
                      className="object-cover"
                      loading="eager"
                    />
                </div>

                {/* <h2 className="text-2xl font-bold">{boss.name}</h2> */}
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

            {boss ? (
              <section className="mb-8 rounded-3xl border border-zinc-800 p-6 text-center transition-all duration-300 bg-zinc-950/40">
                <div className="text-7xl mb-4 inline-block transition-transform overflow-hidden rounded-3xl">
                  {/* {boss.castleImageUrl ? (
                    <Image
                      src={boss.castleImageUrl}
                      alt="Castle"
                      width={250}
                      height={250}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">🏰</span>
                  )} */}

                  <Image
                      src="/images/castle.webp"
                      alt={boss.name}
                      width={250}
                      height={250}
                      className="object-cover"
                      loading="eager"
                    />
                </div>

                <h2 className="text-2xl font-bold">Castle</h2>

                <p className="mb-4 text-zinc-400">
                  HP: {boss.castleCurrentHp} / {boss.castleMaxHp}
                </p>

                <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-blue-500 transition-all duration-700"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.round((boss.castleCurrentHp / boss.castleMaxHp) * 100)
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-sm text-zinc-500">
                  The boss deals {boss.castleDamagePerMin} damage per minute.
                </p>
              </section>
            ) : (
              <p>Loading castle...</p>
            )}
          </div>
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5">
            <div className="mb-8 grid grid-cols-3 gap-4">
              {displayedSymbols.map((symbol, index) => (
                <div
                  key={index}
                  className={[
                    "aspect-[1.3] rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-7xl shadow-inner",
                    "transition-transform duration-100",
                    isSpinning ? "scale-102 animate-pulse" : "scale-100",
                  ].join(" ")}
                >
                  {symbol}
                </div>
              ))}
            </div>
            <button
              onClick={handleSpin}
              disabled={
                isSpinning ||
                !boss ||
                !canSpin ||
                !user ||
                boss.computedStatus !== "active"
              }
              className="w-full rounded-2xl bg-white text-zinc-950 font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
            >
              {isSpinning
                ? "Spinning..."
                : !user
                  ? "Login to spin"
                  : boss?.computedStatus === "won"
                    ? "Boss defeated"
                    : boss?.computedStatus === "lost"
                      ? "Castle fallen"
                      : canSpin
                        ? "Spin"
                        : "Already played today"}
            </button>
          </section>

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
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-zinc-800 px-4 py-3">
              <div className="text-3xl">{result.symbols.join(" ")}</div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">Damage</p>
                <p className="text-xl font-black text-red-300">{result.damage}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </main>
  );
}
