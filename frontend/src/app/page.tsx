'use client';

import useSWR from 'swr';
import TrackItem from '@/components/TrackItem';
import { Search } from 'lucide-react';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const fetcher = (url: string) => fetch(`${url.startsWith('http') ? '' : API_BASE}${url}`).then(r => r.json());

export default function Home() {
  const { data: tracks, error, isLoading } = useSWR('/tracks', fetcher, { 
    refreshInterval: 5000
  });
  const { data: allTags = [] } = useSWR('/tags', fetcher, {
    refreshInterval: 10000
  });
  const [search, setSearch] = useState('');

  if (error) return <div className="text-red-500">Failed to load tracks. Is the backend running?</div>;
  if (!Array.isArray(tracks) && !isLoading) return <div className="text-red-500">Database connection error.</div>;

  const filteredTracks = tracks?.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.file_name.toLowerCase().includes(s)
      || t.tags.some((tag: any) => tag.name.toLowerCase().includes(s))
      || t.notes?.toLowerCase().includes(s);
  }) || [];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My DJ Library</h1>
          <p className="text-zinc-400">Tag your tracks on the go. Sync them at home.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by track, tag or note..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredTracks.map((track: any) => (
            <TrackItem key={track.id} track={track} allTags={allTags} playlist={filteredTracks} />
          ))}
          {filteredTracks.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              No tracks found. Upload some music first!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
