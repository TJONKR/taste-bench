"use client";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const { user, loading, signOut, isConfigured } = useAuth();
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
      <a href="/" className="font-serif text-lg font-semibold text-ink tracking-tight hover:text-accent transition">
        The Taste Bench
      </a>
      <div className="flex items-center gap-4">
        <a href="/" className="text-sm text-ink/50 hover:text-ink transition">Leaderboard</a>
        {isConfigured && !loading && (
          user ? (
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/profile")}
                className="flex items-center gap-2 text-sm text-ink/70 hover:text-ink transition">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-medium text-accent">
                  {user.email?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
              </button>
              <a href="/settings" className="text-xs text-ink/30 hover:text-ink/60 transition">Settings</a>
              <button onClick={() => signOut().then(() => router.refresh())}
                className="text-xs text-ink/30 hover:text-ink/60 transition">
                Sign Out
              </button>
            </div>
          ) : (
            <a href="/auth"
              className="px-4 py-1.5 text-sm border border-border hover:border-accent rounded-lg text-ink/60 hover:text-ink transition">
              Sign In
            </a>
          )
        )}
      </div>
    </nav>
  );
}
