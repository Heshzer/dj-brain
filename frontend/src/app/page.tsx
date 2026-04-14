'use client';

import useSWR from 'swr';
import TrackItem from '@/components/TrackItem';
import { Search, Disc3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/components/AudioPlayerProvider';
import PlayerOverlay from '@/components/PlayerOverlay';

const fetcher = async (url: string) => {
  const res = await fetch(url.startsWith('http') ? url : `/api${url}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'API error');
  }
  return res.json();
};

export default function Home() {
  const { data: tracks, error, isLoading } = useSWR('/tracks', fetcher, { refreshInterval: 5000 });
  const { data: allTags = [] } = useSWR('/tags', fetcher, { refreshInterval: 10000 });
  const [search, setSearch] = useState('');
  const { currentTrack, loadTrack } = useAudioPlayer();

  useEffect(() => {
    if (tracks && tracks.length > 0 && !currentTrack) {
      loadTrack(tracks[0], tracks);
    }
  }, [tracks, currentTrack, loadTrack]);

  if (error) return (
    <div className="text-center py-20" style={{ color: '#ec4899' }}>
      Failed to load tracks. Is the backend running?
    </div>
  );

  const filteredTracks = Array.isArray(tracks) ? tracks.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.file_name.toLowerCase().includes(s)
      || t.tags?.some((tag: any) => tag.name.toLowerCase().includes(s))
      || t.notes?.toLowerCase().includes(s);
  }) : [];

  return (
    <div className="max-w-3xl mx-auto pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Disc3 size={22} style={{ color: '#a855f7' }} />
            <h1 className="text-3xl font-bold tracking-tight gradient-text">My Library</h1>
          </div>
          <p className="text-sm" style={{ color: '#3d3d6b' }}>
            {isLoading ? '...' : `${tracks?.length ?? 0} tracks`} · Tag, écoute, sync.
          </p>
        </div>
      </div>

      {/* Large Integrated Player */}
      <div className="mb-8 w-full">
        <PlayerOverlay />
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="text-lg font-semibold" style={{ color: '#f1f0ff' }}>
          File d'attente
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={15} style={{ color: '#6b6b9a' }} />
          <input
            type="text"
            placeholder="Chercher un track, tag, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all"
            style={{
              background: 'rgba(13,13,26,0.8)',
              border: '1px solid rgba(139,92,246,0.15)',
              color: '#f1f0ff',
              boxShadow: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(168,85,247,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.15)')}
          />
        </div>
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-pulse"
              style={{ background: 'rgba(13,13,26,0.6)', border: '1px solid rgba(139,92,246,0.06)' }} />
          ))}
        </div>
      ) : (
        <div>
          {filteredTracks.map((track: any) => (
            <TrackItem key={track.id} track={track} allTags={allTags} playlist={filteredTracks} />
          ))}
          {filteredTracks.length === 0 && (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <Disc3 size={48} style={{ color: '#3d3d6b' }} />
              <p style={{ color: '#3d3d6b' }}>Aucun track trouvé. Upload des sons d'abord !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
