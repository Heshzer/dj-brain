'use client';

import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerProvider';
import { Play, Pause, SkipForward, SkipBack, Music, Disc3 } from 'lucide-react';
import { motion } from 'framer-motion';
import TagEditor from './TagEditor';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url.startsWith('http') ? url : `/api${url}`).then(r => r.json());

export default function PlayerOverlay() {
  const { currentTrack, isPlaying, togglePlay, progress, seek, playNext, playPrevious } = useAudioPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);

  const { data: allTags = [] } = useSWR('/tags', fetcher, { refreshInterval: 10000 });
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentTrack) setLocalTags(currentTrack.tags?.map((t: any) => t.name) || []);
  }, [currentTrack]);

  if (!currentTrack) return null;

  const durationSec = currentTrack.duration_ms ? currentTrack.duration_ms / 1000 : 0;
  const currentProgress = isDragging ? tempProgress : progress;
  const progressPct = durationSec > 0 ? (currentProgress / durationSec) * 100 : 0;

  const displayTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const saveMetadata = async (newTags: string[]) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tracks/${currentTrack.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      });
      if (res.ok) setLocalTags(newTags);
    } catch { }
    setIsSaving(false);
  };

  return (
    <div
      className="w-full relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(168,85,247,0.2)]"
      style={{ 
        background: 'rgba(13,13,26,0.92)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(168,85,247,0.08)'
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px]"
          style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative flex flex-col md:flex-row gap-8 w-full p-6 md:p-8">

        {/* Left side: Artwork & Track Info */}
        <div className="flex flex-col items-center justify-center w-full md:w-[320px] shrink-0">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-6" style={{ color: '#6b6b9a' }}>
            En Lecture
          </span>

          <div className="relative w-full aspect-square max-w-[240px] mb-6">
            {isPlaying && (
              <motion.div className="absolute -inset-4 rounded-3xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.25) 0%, transparent 70%)' }}
              />
            )}
            <div className="w-full h-full rounded-3xl flex items-center justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.15) 100%)',
                border: '1px solid rgba(168,85,247,0.2)',
                boxShadow: isPlaying
                  ? '0 0 40px rgba(168,85,247,0.3), 0 20px 60px rgba(0,0,0,0.5)'
                  : '0 20px 60px rgba(0,0,0,0.4)',
              }}>
              {isPlaying
                ? <Disc3 size={64} className="animate-spin" style={{ color: 'rgba(168,85,247,0.6)', animationDuration: '4s' }} />
                : <Music size={64} style={{ color: 'rgba(139,92,246,0.3)' }} />
              }
            </div>
          </div>

          <div className="text-center w-full">
            <h2 className="text-lg font-bold line-clamp-2 leading-tight" style={{ color: '#f1f0ff' }}>
              {currentTrack.file_name}
            </h2>
          </div>
        </div>

        {/* Right side: Controls & Tags */}
        <div className="flex flex-col flex-1 justify-center min-w-0">
          
          {/* Tag Editor */}
          <div className="flex-1 overflow-y-auto mb-8 min-h-[140px] rounded-2xl p-4"
            style={{ background: 'rgba(6,6,14,0.6)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <TagEditor
              track={currentTrack}
              localTags={localTags}
              allTags={allTags}
              onSaveTags={saveMetadata}
              embedded={true}
              onClose={() => {}}
            />
          </div>

          {/* Scrubber */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center gap-3 text-xs font-medium mb-6" style={{ color: '#6b6b9a' }}>
              <span className="w-10 text-right">{displayTime(currentProgress)}</span>
              <input
                type="range"
                min={0}
                max={durationSec || currentProgress + 10}
                step={0.1}
                value={currentProgress}
                onChange={e => { setIsDragging(true); setTempProgress(parseFloat(e.target.value)); }}
                onMouseUp={e => { setIsDragging(false); seek(parseFloat((e.target as HTMLInputElement).value)); }}
                onTouchEnd={e => { setIsDragging(false); seek(parseFloat((e.target as HTMLInputElement).value)); }}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(139,92,246,0.2)] focus:outline-none"
                style={{ accentColor: '#a855f7' }}
              />
              <span className="w-10">{displayTime(durationSec || 0)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-8">
              <button onClick={playPrevious}
                className="p-3 rounded-full transition-all hover:bg-[rgba(139,92,246,0.1)] active:scale-90"
                style={{ color: '#a855f7' }}>
                <SkipBack size={24} />
              </button>

              <button onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.5), 0 10px 30px rgba(0,0,0,0.4)',
                  color: '#fff',
                }}>
                {isPlaying
                  ? <Pause size={28} fill="currentColor" />
                  : <Play size={28} fill="currentColor" className="ml-1" />
                }
              </button>

              <button onClick={playNext}
                className="p-3 rounded-full transition-all hover:bg-[rgba(139,92,246,0.1)] active:scale-90"
                style={{ color: '#a855f7' }}>
                <SkipForward size={24} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
