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
  const { isAuthenticated, logout } = useAuth();
  
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  if (!isAuthenticated) return null;

  return (
    <AudioPlayerProvider>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full transition-colors duration-500"
        style={{
          background: 'rgba(6,6,14,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139,92,246,0.1)',
        }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 glow-violet transition-all group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}>
              <ListMusic size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">DJ Brain</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link 
              href="/" 
              className="px-4 py-2 rounded-lg transition-all"
              style={{
                color: pathname === '/' ? '#a855f7' : '#6b6b9a',
                background: pathname === '/' ? 'rgba(168,85,247,0.1)' : 'transparent',
              }}
            >
              Library
            </Link>
            <Link 
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                color: pathname === '/upload' ? '#a855f7' : '#6b6b9a',
                background: pathname === '/upload' ? 'rgba(168,85,247,0.1)' : 'transparent',
              }}
            >
              <UploadCloud size={15} /> Upload
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all ml-2"
              style={{ color: '#3d3d6b', borderLeft: '1px solid rgba(139,92,246,0.1)', borderRadius: 0, paddingLeft: '1rem' }}
            >
              <LogOut size={15} />
            </button>
          </nav>
        </div>
      </header>

      {/* Persistent Player */}
      <div className="sticky top-20 z-30 w-full px-5 max-w-5xl mx-auto pt-2 pb-2">
        <PlayerOverlay />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 pb-8">
        {children}
      </main>
    </AudioPlayerProvider>
  );
}
