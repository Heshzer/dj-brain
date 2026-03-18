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
      className="group relative flex flex-col p-4 rounded-2xl cursor-pointer overflow-hidden mb-2 transition-all duration-300"
      style={{
        background: isCurrent
          ? 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(236,72,153,0.08) 100%)'
          : 'rgba(13,13,26,0.6)',
        border: `1px solid ${isCurrent ? 'rgba(168,85,247,0.35)' : 'rgba(139,92,246,0.08)'}`,
        boxShadow: isCurrent ? '0 0 30px rgba(168,85,247,0.1), inset 0 1px 0 rgba(168,85,247,0.1)' : 'none',
      }}
      onClick={handlePlay}
    >
      {/* Active indicator line */}
      {isCurrent && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
          style={{ background: 'linear-gradient(180deg, #a855f7, #ec4899)' }} />
      )}

      <div className="flex items-center gap-4">
        {/* Play Button */}
        <button
          className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0 transition-all duration-200"
          style={{
            background: isCurrent
              ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
              : 'rgba(139,92,246,0.08)',
            boxShadow: isCurrent ? '0 0 20px rgba(168,85,247,0.4)' : 'none',
            color: isCurrent ? '#fff' : '#6b6b9a',
            transform: 'scale(1)',
          }}
        >
          {isCurrent && isPlaying
            ? <Pause fill="currentColor" size={18} />
            : <Play fill="currentColor" size={18} className="ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate flex items-center gap-2 flex-wrap text-sm"
            style={{ color: isCurrent ? '#e9d5ff' : '#c4b5fd99' }}>
            <span style={{ color: isCurrent ? '#f1f0ff' : '#c4c0e8' }}>{track.file_name}</span>
            {track.sync_status === 'PENDING' && (
              <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                Non Synced
              </span>
            )}
            {track.sync_status === 'SYNCED' && (
              <span className="text-[9px] flex items-center gap-1" style={{ color: '#34d399' }}>
                <CheckCircle2 size={10} /> Synced
              </span>
            )}
          </h4>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {localTags.map((t: string) => {
              const tagObj = allTags.find(gt => gt.name === t);
              const isPerm = tagObj?.is_permanent;
              const bgColor = isPerm ? (tagObj?.color || '#7c3aed') : 'transparent';
              const textColor = isPerm ? '#ffffff' : '#6b6b9a';
              const borderColor = isPerm ? 'transparent' : 'rgba(139,92,246,0.2)';

              return (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: bgColor, color: textColor, border: `1px solid ${borderColor}` }}
                >
                  {t}
                </span>
              );
            })}
            {localTags.length === 0 && (
              <span className="text-[10px] italic" style={{ color: '#3d3d6b' }}>Aucun tag</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
