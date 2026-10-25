import { useState } from "react";
import type { Seat } from "@cardgame/engine";
import type { LobbyMessage } from "../net/client";

interface LobbyScreenProps {
  lobby: LobbyMessage;
  mySeat: Seat | null;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function LobbyScreen({
  lobby,
  mySeat,
  onStartGame,
  onLeaveRoom,
}: LobbyScreenProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?code=${lobby.code}` : "";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sevens Card Game",
          text: `Join my Sevens game room ${lobby.code}!`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Link copied");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      // Fallback: copy code only
      try {
        await navigator.clipboard.writeText(lobby.code);
        setFeedback("Code copied");
        setTimeout(() => setFeedback(null), 2000);
      } catch {
        // Ignore
      }
    }
  };

  const isHost = mySeat !== null && lobby.hostSeat !== null && mySeat === lobby.hostSeat;
  const isFull = lobby.players.length === 4;

  const seats: Seat[] = [0, 1, 2, 3];

  return (
    <div className="min-h-[100dvh] bg-zinc-100 flex flex-col justify-center p-4 safe-area-pt safe-area-pb safe-area-pl safe-area-pr">
      <div className="max-w-[480px] w-full mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Game Lobby</h2>
            <p className="text-xs text-zinc-500">Waiting for 4 players to assemble</p>
          </div>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs text-zinc-500 hover:text-red-600 font-semibold rounded-xl border border-zinc-200 hover:border-red-200 transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
          >
            Leave
          </button>
        </div>

        <div className="text-center py-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Room Code
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-zinc-900">
            {lobby.code}
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[44px] px-5 py-2 inline-flex items-center justify-center text-sm font-semibold bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 shadow-xs transition-colors cursor-pointer touch-manipulation"
            >
              {feedback ? `✓ ${feedback}` : "Share Link"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            <span>Players</span>
            <span>{lobby.players.length} / 4 Seated</span>
          </div>

          <div className="space-y-2">
            {seats.map((seatIndex) => {
              const player = lobby.players.find((p) => p.seat === seatIndex);
              const isLocal = mySeat !== null && player?.seat === mySeat;
              const isSeatHost = lobby.hostSeat !== null && player?.seat === lobby.hostSeat;

              return (
                <div
                  key={seatIndex}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                    player
                      ? isLocal
                        ? "bg-blue-50/70 border-blue-200 text-zinc-900"
                        : "bg-white border-zinc-200 text-zinc-900"
                      : "bg-zinc-50 border-dashed border-zinc-200 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 text-xs font-mono font-bold text-zinc-400">
                      #{seatIndex + 1}
                    </span>
                    <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                      {player ? player.name : "Empty Seat"}
                    </span>
                    {isLocal && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">
                        You
                      </span>
                    )}
                    {isSeatHost && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                        Host
                      </span>
                    )}
                  </div>

                  {player && (
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          player.connected ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span className={player.connected ? "text-zinc-600 font-medium" : "text-red-500 font-medium"}>
                        {player.connected ? "Ready" : "Offline"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          {isHost ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onStartGame}
                disabled={!isFull}
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-base shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation flex items-center justify-center"
              >
                {isFull ? "Start Game" : `Waiting for 4 players (${lobby.players.length}/4)`}
              </button>
              {!isFull && (
                <p className="text-xs text-center text-zinc-500">
                  All 4 seats must be occupied before starting
                </p>
              )}
            </div>
          ) : (
            <div className="text-center p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600 font-medium">
              Waiting for the host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
