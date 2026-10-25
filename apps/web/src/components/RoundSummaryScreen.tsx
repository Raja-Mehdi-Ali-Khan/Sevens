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
    <div className="min-h-[100dvh] bg-transparent flex flex-col justify-between p-3 sm:p-6 overflow-y-auto safe-top safe-bottom select-none">
      <div className="theme-panel max-w-md w-full mx-auto rounded-2xl p-4 sm:p-6 space-y-5 my-auto">
        <div className="text-center space-y-1.5">
          <span className="theme-badge uppercase tracking-wider inline-block">
            Round {view.round} Completed
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--tx)]">
            {winnerName} won the round!
          </h2>
          <p className="text-xs text-[var(--mut)]">
            Round winner scores 0 penalty points. Other players score the sum of cards in hand.
          </p>
        </div>

        {/* Scores Table */}
        <div className="overflow-hidden border border-[var(--edge)] rounded-xl">
          <table className="min-w-full divide-y divide-[var(--edge)] text-xs sm:text-sm">
            <thead className="bg-transparent text-[10px] sm:text-xs font-semibold text-[var(--mut)] uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-2 py-2 text-center">Round</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--edge)] bg-transparent">
              {seats.map((seat) => {
                const name = getPlayerName(seat);
                const isWinner = seat === winnerSeat;
                const isLocal = seat === view.seat;
                const roundPenalty = view.roundScores?.[seat] ?? 0;
                const totalPenalty = view.totals[seat] ?? 0;

                return (
                  <tr
                    key={seat}
                    className={isWinner ? "theme-winner-row font-semibold" : isLocal ? "theme-local-row" : ""}
                  >
                    <td className="px-3 py-2 flex items-center gap-1.5">
                      <span className="truncate max-w-[100px] text-[var(--tx)]">{name}</span>
                      {isLocal && (
                        <span className="theme-badge">
                          You
                        </span>
                      )}
                      {isWinner && (
                        <span className="theme-badge">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center ">
                      +{roundPenalty}
                    </td>
                    <td className="px-3 py-2 text-right  font-bold text-[var(--tx)]">
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
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mut)]">
            Final Table
          </div>
          <div className="flex justify-center">
            <SuitTable table={view.table} />
          </div>
        </div>

        {/* Auto Next Round Note */}
        <div className="text-center pt-1">
          <div className="theme-panel inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[var(--acc)]" />
            <span>Next round starts automatically...</span>
          </div>
        </div>

        {/* Large Leave Room / Back Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="theme-button-secondary w-full min-h-[44px] py-2.5 px-4 text-sm touch-manipulation cursor-pointer"
          >
            Leave game
          </button>
        </div>
      </div>
    </div>
  );
}
