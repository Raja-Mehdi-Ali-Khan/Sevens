import { useState } from "react";

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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-zinc-200 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Sevens</h1>
          <p className="text-sm text-zinc-500">4-player online card game</p>
        </div>

        {(error || validationError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error || validationError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name-input" className="block text-sm font-medium text-zinc-700 mb-1">
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
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-zinc-400 mt-1">1 to 20 characters</p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!isNameValid || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Or join with code
            </span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label htmlFor="code-input" className="block text-sm font-medium text-zinc-700 mb-1">
                Room Code
              </label>
              <input
                id="code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="5-letter code"
                maxLength={5}
                disabled={loading}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!isNameValid || !isCodeValid || loading}
              className="w-full bg-zinc-800 hover:bg-zinc-900 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
