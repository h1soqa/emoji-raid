import Link from "next/link";
import { Leaderboard } from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Leaderboard</h1>
            <p className="mt-1 text-zinc-400">
              Daily attacks and all-time damage ranking.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700"
          >
            Back to game
          </Link>
        </div>

        <Leaderboard />
      </div>
    </main>
  );
}