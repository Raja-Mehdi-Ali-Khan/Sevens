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
    <div className="min-h-[100dvh] bg-zinc-100 flex flex-col justify-between p-3 sm:p-6 overflow-y-auto safe-top safe-bottom select-none">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 sm:p-6 space-y-5 my-auto">
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            Round {view.round} Completed
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
            {winnerName} won the round!
          </h2>
          <p className="text-xs text-zinc-500">
            Round winner scores 0 penalty points. Other players score the sum of cards in hand.
          </p>
        </div>

        {/* Scores Table */}
        <div className="overflow-hidden border border-zinc-200 rounded-xl">
          <table className="min-w-full divide-y divide-zinc-200 text-xs sm:text-sm">
            <thead className="bg-zinc-50 text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-2 py-2 text-center">Round</th>
                <th className="px-3 py-2 text-right">Total</th>
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
                    <td className="px-3 py-2 flex items-center gap-1.5">
                      <span className="truncate max-w-[100px] text-zinc-900">{name}</span>
                      {isLocal && (
                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold">
                          You
                        </span>
                      )}
                      {isWinner && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center font-mono">
                      +{roundPenalty}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-zinc-900">
                      {totalPenalty} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Final Board State for the round */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Final Table
          </div>
          <div className="flex justify-center">
            <SuitTable table={view.table} />
          </div>
        </div>

        {/* Auto Next Round Note */}
        <div className="text-center pt-1">
          <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Next round starts automatically...</span>
          </div>
        </div>

        {/* Large Leave Room / Back Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full min-h-[44px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2.5 px-4 rounded-xl text-sm border border-zinc-300 transition-colors touch-manipulation cursor-pointer"
          >
            Leave game
          </button>
        </div>
      </div>
    </div>
  );
}
