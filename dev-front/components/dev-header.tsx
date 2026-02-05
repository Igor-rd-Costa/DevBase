"use client";

import { User, LogOut, Github, Terminal, Monitor } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { getAuthUrl } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import CodeConfiguredGitProjectSelect from "@/components/code/git/code-configured-git-project-select";
import { useView } from "@/contexts/view-context";
import { ViewMode } from "@/types/view-mode";

type DevHeaderProps = {
  className?: string;
}

export default function DevHeader({ className = "" }: DevHeaderProps) {
  const { user, logout, loading } = useAuth();
  const { viewMode, setViewMode } = useView();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className={`bg-white dark:bg-zinc-900 shadow-[0_2px_5px_1px_black] h-[3.5rem] grid px-8 grid-cols-[3rem_1fr_auto] items-center font-bold z-[100] ${className}`}>
      <div>DevApp</div>
      <div></div>
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="w-4 h-4 border-2 border-zinc-600 dark:border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            {viewMode !== ViewMode.CONFIGURED_PROJECT && (
              <>
                <div className="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1 mr-2 border border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setViewMode(ViewMode.APP)}
                    className={`px-3 py-1 flex items-center gap-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.APP
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                  >
                    <Monitor className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => setViewMode(ViewMode.CODE)}
                    className={`px-3 py-1 flex items-center gap-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.CODE
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                  >
                    <Terminal className="w-4 h-4" />
                    Code
                  </button>
                </div>
                <CodeConfiguredGitProjectSelect />
              </>
            )}
            <div className="relative w-8 h-8" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="focus:outline-none"
                aria-label="Profile menu"
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.login}
                    width={32}
                    height={32}
                    className="rounded-full cursor-pointer hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-600 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 p-1 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                    <User className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                )}
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-[101] overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {user.login}
                    </p>
                    {user.name && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {user.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <LogOut className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="px-2 py-1 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoggingIn ? (
              "Loading..."
            ) : (
              <>
                <Github className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}