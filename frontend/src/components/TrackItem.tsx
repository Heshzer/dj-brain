'use client';

import React from 'react';
import { useAudioPlayer } from './AudioPlayerProvider';
import { Play, Pause, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalTag { id: string; name: string; color?: string; is_permanent?: boolean; }

export default function TrackItem({ track, allTags = [], playlist = [] }: { track: any; allTags?: GlobalTag[]; playlist?: any[] }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();
  const isCurrent = currentTrack?.id === track.id;
  const localTags = track.tags?.map((t: any) => t.name) || [];

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else playTrack(track, playlist);
  };

  return (
    <div 
      className={cn(
        "group relative flex flex-col p-4 rounded-xl border transition-all mb-3 cursor-pointer overflow-hidden",
        isCurrent ? "bg-purple-900/20 border-purple-500/50" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
      )}
      onClick={handlePlay}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-4">
        <button
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-transform",
            isCurrent ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]" : "bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700"
          )}
        >
          {isCurrent && isPlaying
            ? <Pause fill="currentColor" size={20} />
            : <Play fill="currentColor" size={20} className="ml-1" />}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-100 truncate flex items-center gap-2 flex-wrap">
            {track.file_name}
            {track.sync_status === 'PENDING' && (
              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Non Synced</span>
            )}
            {track.sync_status === 'SYNCED' && (
              <span className="text-[10px] flex items-center gap-1 text-green-500"><CheckCircle2 size={12} /> Synced</span>
            )}
          </h4>

          {/* Tags actuels */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {localTags.map((t: string) => {
              const tagObj = allTags.find(gt => gt.name === t);
              const isPerm = tagObj?.is_permanent;
              const bgColor = isPerm ? (tagObj?.color || '#444444') : 'transparent';
              const textColor = isPerm ? '#ffffff' : '#a1a1aa';
              const borderColor = isPerm ? 'transparent' : '#3f3f46';
              
              return (
                <span 
                  key={t} 
                  className="text-[10px] px-2 py-0.5 rounded-md border font-medium truncate shadow-sm"
                  style={{ backgroundColor: bgColor, color: textColor, borderColor }}
                >
                  {t}
                </span>
              );
            })}
            {localTags.length === 0 && (
              <span className="text-[10px] text-zinc-600 italic">Aucun tag</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
