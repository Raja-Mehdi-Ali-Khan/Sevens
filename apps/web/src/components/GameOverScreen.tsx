import type { PlayerView, Seat } from "@cardgame/engine";
import type { LobbyMessage } from "../net/client";

interface GameOverScreenProps {
  view: PlayerView;
  lobby: LobbyMessage | null;
  onBackToHome: () => void;
}

export function GameOverScreen({
  view,
  lobby,
  onBackToHome,
}: GameOverScreenProps) {
  const getPlayerName = (seat: Seat): string => {
    return lobby?.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat + 1}`;
  };

  const winners = view.winners ?? [];
  const winnerNames = winners.map((seat) => getPlayerName(seat));

  const seats: Seat[] = [0, 1, 2, 3];
  // Sort players by total score ascending (lowest penalty wins)
  const rankedSeats = [...seats].sort((a, b) => (view.totals[a] ?? 0) - (view.totals[b] ?? 0));

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-200 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Game Over (7 Rounds Complete)
          </span>
          <h1 className="text-3xl font-extrabold text-zinc-900">
            {winnerNames.length > 1
              ? `Tie: ${winnerNames.join(" & ")} win!`
              : `${winnerNames[0] ?? "Winner"} wins!`}
          </h1>
          <p className="text-xs text-zinc-500">
            Lowest cumulative penalty points after 7 rounds wins the match.
          </p>
        </div>

        {/* Final Standings */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Final Standings
          </div>
          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
            {rankedSeats.map((seat, index) => {
              const name = getPlayerName(seat);
              const isWinner = winners.includes(seat);
              const isLocal = seat === view.seat;
              const total = view.totals[seat] ?? 0;

              return (
                <div
                  key={seat}
                  className={`flex items-center justify-between p-3 text-sm ${
                    isWinner
                      ? "bg-amber-50/80 font-bold text-amber-950"
                      : isLocal
                      ? "bg-blue-50/30 text-zinc-900"
                      : "bg-white text-zinc-700"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 text-xs font-mono font-bold ${
                        isWinner ? "text-amber-600" : "text-zinc-400"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span>{name}</span>
                    {isLocal && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                        You
                      </span>
                    )}
                    {isWinner && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                        Winner
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-bold text-right">
                    {total} <span className="text-xs font-normal text-zinc-500">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onBackToHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
