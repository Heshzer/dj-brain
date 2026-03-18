'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ListMusic, UploadCloud, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import PlayerOverlay from './PlayerOverlay';
import { AudioPlayerProvider } from './AudioPlayerProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  // If we are not on login page and not authenticated, AuthProvider already handles redirecting
  if (!isAuthenticated) return null;

  return (
    <AudioPlayerProvider>
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-zinc-800 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <ListMusic size={18} />
            </div>
            DJ Brain
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-purple-400 transition-colors">Library</Link>
            <Link href="/upload" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
              <UploadCloud size={16} /> Upload
            </Link>
            <button onClick={logout} className="flex items-center gap-2 text-zinc-400 hover:text-red-400 transition-colors ml-4 border-l border-zinc-800 pl-4">
              <LogOut size={16} /> Quitter
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Persistent Player */}
      <PlayerOverlay />
    </AudioPlayerProvider>
  );
}
