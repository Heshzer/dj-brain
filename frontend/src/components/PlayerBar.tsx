'use client';

import { useAudioPlayer } from './AudioPlayerProvider';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { useState } from 'react';

export default function PlayerBar() {
  const { currentTrack, isPlaying, togglePlay, progress, seek } = useAudioPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);

  if (!currentTrack) return null;

  const durationSec = currentTrack.duration_ms ? currentTrack.duration_ms / 1000 : 0;
  // Fallback since duration_ms might be empty on first upload before parsing
  // Howler knows the duration when loaded, but let's just make a simple slider for now.

  const currentProgress = isDragging ? tempProgress : progress;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTempProgress(val);
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(false);
    seek(parseFloat((e.target as HTMLInputElement).value));
  };

  const displayTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-6 z-50 text-white">
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate">{currentTrack.file_name}</h3>
        <div className="flex gap-2 mt-1 truncate">
          {currentTrack.tags?.map((t: any) => {
            const isPerm = t.is_permanent;
            return (
              <span 
                key={t.id} 
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: isPerm ? (t.color || '#444444') : 'transparent',
                  color: isPerm ? '#ffffff' : '#a1a1aa',
                  borderColor: isPerm ? 'transparent' : '#3f3f46'
                }}
              >
                {t.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center">
        <div className="flex items-center gap-4 mb-2">
          <button className="text-zinc-400 hover:text-white transition"><SkipBack size={20} /></button>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button className="text-zinc-400 hover:text-white transition"><SkipForward size={20} /></button>
        </div>
        <div className="w-full max-w-md flex items-center gap-3 text-xs text-zinc-400">
          <span>{displayTime(currentProgress)}</span>
          <input
            type="range"
            min={0}
            max={durationSec || currentProgress + 10} // Just a fallback if duration not known instantly
            value={currentProgress}
            onChange={handleSeek}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={handleSeekEnd}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={handleSeekEnd}
            className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <span>{displayTime(durationSec || 0)}</span>
        </div>
      </div>

      {/* Extras (Volume) */}
      <div className="flex-1 flex justify-end items-center gap-3 text-zinc-400 hidden md:flex">
        <Volume2 size={18} />
      </div>
    </div>
  );
}
