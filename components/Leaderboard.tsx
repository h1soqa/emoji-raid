"use client";

import { useEffect, useState } from "react";

type LeaderboardPeriod = "today" | "all";

type LeaderboardRow = {
  rank: number;
  userId: string;
  playerName: string;
  symbols: string[];
  damage: number;
  attacks?: number;
  createdAt?: string;
};

type LeaderboardResponse = {
  period: LeaderboardPeriod;
  rows: LeaderboardRow[];
};

type LeaderboardProps = {
  refreshKey?: number;
};

export function Leaderboard({ refreshKey = 0 }: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadLeaderboard(selectedPeriod: LeaderboardPeriod) {
    setIsLoading(true);

    const response = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
    const data: LeaderboardResponse = await response.json();

    setRows(data.rows);
    setIsLoading(false);
  }

  useEffect(() => {
    loadLeaderboard(period);
  }, [period, refreshKey]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">Leaderboard</h2>
          <p className="text-sm text-zinc-400">
            {period === "today"
                ? "Today's strongest attacks"
                : "All-time damage ranking"}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPeriod("today")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-bold transition",
            period === "today"
              ? "bg-white text-zinc-950"
              : "bg-zinc-800 text-white hover:bg-zinc-700",
          ].join(" ")}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => setPeriod("all")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-bold transition",
            period === "all"
              ? "bg-white text-zinc-950"
              : "bg-zinc-800 text-white hover:bg-zinc-700",
          ].join(" ")}
        >
          All time
        </button>
      </div>

      {isLoading ? (
        <p className="rounded-2xl bg-zinc-900 p-4 text-center text-zinc-400">
          Loading leaderboard...
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-zinc-900 p-4 text-center text-zinc-400">
          No attacks yet.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={`${period}-${row.userId}-${row.rank}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black">
                #{row.rank}
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold">{row.playerName}</p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xl tracking-wider">
                    {row.symbols.length > 0
                      ? row.symbols.join(" ")
                      : "—"}
                  </span>

                  {period === "all" && (
                    <span className="text-xs text-zinc-500">
                      {row.attacks} attacks
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-black text-red-300">
                  {period === "today" ? "-" : ""}
                  {row.damage}
                </p>
                <p className="text-xs text-zinc-500">
                  {period === "today" ? "damage" : "total"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}