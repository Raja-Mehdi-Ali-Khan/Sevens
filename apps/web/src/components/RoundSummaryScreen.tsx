import type { PlayerView, Seat } from "@cardgame/engine";
import type { LobbyMessage } from "../net/client";
import { SuitTable } from "./SuitTable";

interface RoundSummaryScreenProps {
  view: PlayerView;
  lobby: LobbyMessage | null;
  onLeaveRoom: () => void;
}

export function RoundSummaryScreen({
  view,
  lobby,
  onLeaveRoom,
}: RoundSummaryScreenProps) {
  const getPlayerName = (seat: Seat): string => {
    return lobby?.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat + 1}`;
  };

  const winnerSeat = view.roundWinner;
  const winnerName = winnerSeat !== null ? getPlayerName(winnerSeat) : "Unknown";

  const seats: Seat[] = [0, 1, 2, 3];

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between p-3 sm:p-6">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-lg border border-zinc-200 p-5 sm:p-8 space-y-6 my-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Round {view.round} Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
            {winnerName} won the round!
          </h2>
          <p className="text-sm text-zinc-500">
            The round winner scores 0 penalty points. Other players score the sum of ranks left in hand.
          </p>
        </div>

        {/* Scores Table */}
        <div className="overflow-hidden border border-zinc-200 rounded-xl">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center">Round {view.round} Penalty</th>
                <th className="px-4 py-3 text-right">Running Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {seats.map((seat) => {
                const name = getPlayerName(seat);
                const isWinner = seat === winnerSeat;
                const isLocal = seat === view.seat;
                const roundPenalty = view.roundScores?.[seat] ?? 0;
                const totalPenalty = view.totals[seat] ?? 0;

                return (
                  <tr
                    key={seat}
                    className={isWinner ? "bg-emerald-50/60 font-semibold" : isLocal ? "bg-blue-50/30" : ""}
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <span className="text-zinc-900">{name}</span>
                      {isLocal && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                          You
                        </span>
                      )}
                      {isWinner && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          Winner (0)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      +{roundPenalty}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900">
                      {totalPenalty} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Final Board State for the round */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Final Table
          </div>
          <SuitTable table={view.table} />
        </div>

        {/* Auto Next Round Note */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 text-xs font-medium px-4 py-2 rounded-full border border-zinc-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Next round starts automatically in a few seconds...</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onLeaveRoom}
            className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Leave game
          </button>
        </div>
      </div>
    </div>
  );
}
