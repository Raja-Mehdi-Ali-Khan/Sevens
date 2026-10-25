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
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(lobby.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  const isHost = mySeat !== null && lobby.hostSeat !== null && mySeat === lobby.hostSeat;
  const isFull = lobby.players.length === 4;

  const seats: Seat[] = [0, 1, 2, 3];

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-zinc-200 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Game Lobby</h2>
            <p className="text-xs text-zinc-500">Share this code with friends</p>
          </div>
          <button
            onClick={onLeaveRoom}
            className="text-xs text-zinc-500 hover:text-red-600 font-medium px-2.5 py-1.5 rounded border border-zinc-200 hover:border-red-200 transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>

        <div className="text-center py-4 bg-zinc-100 rounded-lg border border-zinc-200 space-y-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Room Code
          </div>
          <div className="text-4xl font-mono font-extrabold tracking-widest text-zinc-900">
            {lobby.code}
          </div>
          <div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 text-zinc-700 shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? "✓ Copied to clipboard" : "Copy Code"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                    player
                      ? isLocal
                        ? "bg-blue-50/60 border-blue-200 text-zinc-900"
                        : "bg-white border-zinc-200 text-zinc-900"
                      : "bg-zinc-50 border-dashed border-zinc-200 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 text-xs font-mono font-semibold text-zinc-400">
                      #{seatIndex + 1}
                    </span>
                    <span className="font-medium">
                      {player ? player.name : "Waiting for player..."}
                    </span>
                    {isLocal && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                        You
                      </span>
                    )}
                    {isSeatHost && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
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
                      <span className={player.connected ? "text-zinc-600" : "text-red-500"}>
                        {player.connected ? "Ready" : "Disconnected"}
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
                onClick={onStartGame}
                disabled={!isFull}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg text-sm shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
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
            <div className="text-center p-3 bg-zinc-100 rounded-lg text-xs text-zinc-600">
              Waiting for the host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
