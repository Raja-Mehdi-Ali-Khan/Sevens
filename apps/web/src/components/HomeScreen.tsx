import { useEffect, useState } from "react";

interface HomeScreenProps {
  initialName: string;
  error: string | null;
  loading: boolean;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}

export function HomeScreen({
  initialName,
  error,
  loading,
  onCreateRoom,
  onJoinRoom,
}: HomeScreenProps) {
  const [name, setName] = useState(initialName);
  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check URL parameters for ?code=XXXXX
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      if (urlCode) {
        setCode(urlCode.trim().toUpperCase().slice(0, 5));
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const trimmedName = name.trim();
  const trimmedCode = code.trim().toUpperCase();

  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= 20;
  const isCodeValid = trimmedCode.length === 5;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      setValidationError("Name must be between 1 and 20 characters");
      return;
    }
    setValidationError(null);
    onCreateRoom(trimmedName);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      setValidationError("Name must be between 1 and 20 characters");
      return;
    }
    if (!isCodeValid) {
      setValidationError("Room code must be exactly 5 characters");
      return;
    }
    setValidationError(null);
    onJoinRoom(trimmedCode, trimmedName);
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-100 flex flex-col justify-center p-4 safe-area-pt safe-area-pb safe-area-pl safe-area-pr">
      <div className="max-w-[480px] w-full mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 text-2xl font-bold mb-1 shadow-2xs">
            7
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Sevens</h1>
          <p className="text-sm text-zinc-500">4-player online card game</p>
        </div>

        {(error || validationError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error || validationError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name-input" className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Your Name
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice"
              maxLength={20}
              disabled={loading}
              className="w-full min-h-[44px] px-3.5 py-2.5 border border-zinc-300 rounded-xl text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 touch-manipulation"
            />
            <p className="text-xs text-zinc-400 mt-1">1 to 20 characters</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!isNameValid || loading}
              className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-base shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation flex items-center justify-center"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Or join with code
            </span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label htmlFor="code-input" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                Room Code
              </label>
              <input
                id="code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="5-letter code"
                maxLength={5}
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={loading}
                className="w-full min-h-[44px] px-3.5 py-2.5 border border-zinc-300 rounded-xl text-base font-mono tracking-widest uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 touch-manipulation"
              />
            </div>
            <button
              type="submit"
              disabled={!isNameValid || !isCodeValid || loading}
              className="w-full min-h-[48px] bg-zinc-800 hover:bg-zinc-900 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-base shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation flex items-center justify-center"
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
