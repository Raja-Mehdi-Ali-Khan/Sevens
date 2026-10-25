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
    <div className="min-h-[100dvh] bg-transparent flex flex-col items-center justify-center p-4 overflow-y-auto safe-top safe-bottom select-none">
      <div className="theme-panel max-w-md w-full rounded-2xl p-5 sm:p-7 space-y-5 my-auto">
        <div className="text-center space-y-1.5">
          <span className="theme-badge uppercase tracking-widest inline-block">
            Game Over (7 Rounds Complete)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--tx)]">
            {winnerNames.length > 1
              ? `Tie: ${winnerNames.join(" & ")} win!`
              : `${winnerNames[0] ?? "Winner"} wins!`}
          </h1>
          <p className="text-xs text-[var(--mut)]">
            Lowest cumulative penalty points after 7 rounds wins the match.
          </p>
        </div>

        {/* Final Standings */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mut)]">
            Final Standings
          </div>
          <div className="divide-y divide-[var(--edge)] border border-[var(--edge)] rounded-xl overflow-hidden">
            {rankedSeats.map((seat, index) => {
              const name = getPlayerName(seat);
              const isWinner = winners.includes(seat);
              const isLocal = seat === view.seat;
              const total = view.totals[seat] ?? 0;

              return (
                <div
                  key={seat}
                  className={`flex items-center justify-between p-3 text-xs sm:text-sm ${
                    isWinner
                      ? "theme-winner-row font-bold"
                      : isLocal
                      ? "theme-local-row text-[var(--tx)]"
                      : "text-[var(--tx)]"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 text-xs  font-bold ${
                        isWinner ? "text-[var(--acc)]" : "text-[var(--mut)]"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{name}</span>
                    {isLocal && (
                      <span className="theme-badge">
                        You
                      </span>
                    )}
                    {isWinner && (
                      <span className="theme-badge uppercase">
                        Winner
                      </span>
                    )}
                  </div>
                  <div className=" font-bold text-right">
                    {total} <span className="text-[11px] font-normal text-[var(--mut)]">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Large 44px+ min-height */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="theme-button-primary w-full min-h-[48px] py-3 px-4 text-sm touch-manipulation cursor-pointer flex items-center justify-center"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
