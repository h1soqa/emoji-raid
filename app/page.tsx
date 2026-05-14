"use client";

import { useEffect, useMemo, useState } from "react";

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

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "";

    const existingUserId = localStorage.getItem("emoji-raid-user-id");

    if (existingUserId) {
      return existingUserId;
    }

    const newUserId = crypto.randomUUID();
    localStorage.setItem("emoji-raid-user-id", newUserId);

    return newUserId;
  }, []);

  async function loadTodayStatus() {
    if (!userId) return;

    const response = await fetch(`/api/me/today?userId=${userId}`);
    const data: TodayStatus = await response.json();

    setBoss(data.boss);
    setCanSpin(data.canSpin);
    setTodaySpin(data.spin);

    if (data.spin) {
      setDisplayedSymbols(data.spin.symbols.split(","));
    }
  }

  async function handleSpin() {
    setError(null);
    setResult(null);

    const statusResponse = await fetch(`/api/me/today?userId=${userId}`);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
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

  useEffect(() => {
    loadTodayStatus();
  }, [userId]);

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
              {boss.emoji}
            </div>

            <h2 className="text-2xl font-bold">{boss.name}</h2>

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
          disabled={isSpinning || !boss || !canSpin}
          className="w-full rounded-2xl bg-white text-zinc-950 font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition"
        >
          {isSpinning ? "Spinning..." : canSpin ? "Spin" : "Already played today"}
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
    </main>
  );
}