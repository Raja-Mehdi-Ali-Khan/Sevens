import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import emblem from "../assets/brand/emblem.svg";
import {
  isValidPlayerName,
  isValidRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  parseInviteCode,
} from "../lib/home";

interface HomeScreenProps {
  initialName: string;
  error: string | null;
  loading: boolean;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}

const PLAYER_NAME_STORAGE_KEY = "sevens:playerName";

function getInitialName(initialName: string): string {
  if (initialName) return initialName;
  try {
    return localStorage.getItem(PLAYER_NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  return parseInviteCode(window.location.search);
}

export function HomeScreen({
  initialName,
  error,
  loading,
  onCreateRoom,
  onJoinRoom,
}: HomeScreenProps) {
  const [inviteCode] = useState(getInviteCode);
  const [name, setName] = useState(() => getInitialName(initialName));
  const [code, setCode] = useState(() => inviteCode ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(null);
  const [showWakeMessage, setShowWakeMessage] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const normalizedName = normalizePlayerName(name);
  const normalizedCode = normalizeRoomCode(code);
  const nameIsValid = isValidPlayerName(name);
  const codeIsValid = isValidRoomCode(normalizedCode);

  useEffect(() => {
    if (inviteCode) nameInputRef.current?.focus();
  }, [inviteCode]);

  useEffect(() => {
    if (!loading) {
      setShowWakeMessage(false);
      setPendingAction(null);
      return;
    }

    const timer = window.setTimeout(() => setShowWakeMessage(true), 3000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const changeName = (value: string) => {
    setName(value);
    setValidationError(null);
    try {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, value);
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  };

  const createRoom = () => {
    if (!isValidPlayerName(name)) {
      setValidationError("Enter a name from 1 to 20 characters.");
      return;
    }
    setValidationError(null);
    setPendingAction("create");
    onCreateRoom(normalizedName);
  };

  const joinRoom = () => {
    if (!isValidPlayerName(name)) {
      setValidationError("Enter a name from 1 to 20 characters.");
      return;
    }
    if (!isValidRoomCode(normalizedCode)) {
      setValidationError("Enter a valid 5-character room code.");
      return;
    }
    setValidationError(null);
    setPendingAction("join");
    onJoinRoom(normalizedCode, normalizedName);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    joinRoom();
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (inviteCode) joinRoom();
      else createRoom();
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(normalizeRoomCode(value).slice(0, 5));
    setValidationError(null);
  };

  const createBusy = loading && pendingAction === "create";
  const joinBusy = loading && pendingAction === "join";

  return (
    <main className="home-screen min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 py-3 safe-area-pt safe-area-pb safe-area-pl safe-area-pr">
      <div className="home-content w-full max-w-[400px] flex flex-col items-center gap-3">
        <img src={emblem} alt="Sevens emblem" width={112} height={112} className="h-28 w-28 shrink-0" />

        <header className="text-center">
          <h1 className="m-0 text-[34px] font-bold tracking-[8px] text-[var(--acc)]">SEVENS</h1>
          <p className="mt-1 text-sm text-[var(--mut)]">A four-player card game. Empty your hand first.</p>
        </header>

        {inviteCode && (
          <div className="home-invite w-full rounded-xl border border-[var(--acc)] px-3 py-2 text-center text-sm text-[var(--acc)]">
            {"You\u2019re invited to room "}{inviteCode}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="home-panel theme-panel w-full rounded-2xl border p-4">
          <label htmlFor="name-input" className="mb-1 block text-sm font-semibold text-[var(--tx)]">
            Your name
          </label>
          <input
            ref={nameInputRef}
            id="name-input"
            type="text"
            value={name}
            onChange={(event) => changeName(event.target.value)}
            onKeyDown={handleNameKeyDown}
            placeholder="Enter your name"
            maxLength={20}
            disabled={loading}
            autoComplete="name"
            className="theme-input min-h-[44px] w-full px-3 py-2 text-base"
          />

          <button
            type="button"
            onClick={createRoom}
            disabled={!nameIsValid || loading}
            className={`${inviteCode ? "theme-button-secondary" : "theme-button-primary"} mt-3 min-h-12 w-full px-4 py-3 text-base disabled:opacity-50`}
          >
            {createBusy ? "Creating..." : "Create room"}
          </button>

          <div className="home-divider my-3 flex items-center gap-3 text-xs text-[var(--mut)]">
            <span className="h-px flex-1 bg-[var(--edge)]" />
            <span>or join with a code</span>
            <span className="h-px flex-1 bg-[var(--edge)]" />
          </div>

          <div className="flex items-stretch gap-2">
            <label htmlFor="code-input" className="sr-only">Room code</label>
            <input
              id="code-input"
              type="text"
              value={code}
              onChange={(event) => handleCodeChange(event.target.value)}
              placeholder="ABCDE"
              maxLength={5}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={loading}
              className="theme-input min-h-12 min-w-0 flex-1 px-2 py-2 text-center text-base tracking-[4px] uppercase"
            />
            <button
              type="submit"
              disabled={!nameIsValid || !codeIsValid || loading}
              className={`${inviteCode ? "theme-button-primary" : "theme-button-secondary"} min-h-12 min-w-[72px] px-3 py-2 text-base disabled:opacity-50`}
            >
              {joinBusy ? "Joining..." : "Join"}
            </button>
          </div>

          {(error || validationError) && (
            <div role="alert" className="home-error mt-3 rounded-lg border border-[var(--rt)]/60 px-3 py-2 text-sm text-[var(--rt)]">
              {error || validationError}
            </div>
          )}
        </form>

        {showWakeMessage && (
          <p className="home-wake-note m-0 text-center text-sm text-[var(--mut)]">
            Waking the server. This can take up to a minute on the first visit.
          </p>
        )}

        <details className="home-how w-full text-sm text-[var(--mut)]">
          <summary className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[var(--edge)] px-3 text-[var(--tx)]">
            How to play
          </summary>
          <div className="space-y-2 px-2 py-3 leading-relaxed">
            <p>4 players, 13 cards each.</p>
            <p>Whoever holds the 7 of hearts starts. Build each suit outward from its 7, up to king and down to ace.</p>
            <p>Each turn you must play a legal card. If you have none, you are skipped.</p>
            <p>First to empty their hand wins the round and scores 0. Others score the value of their leftover cards (ace 1, king 13).</p>
            <p>After 7 rounds the lowest total wins.</p>
          </div>
        </details>

        <footer className="text-xs text-[var(--mut)]">{"4 players \u00B7 7 rounds"}</footer>
      </div>
    </main>
  );
}
