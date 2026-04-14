'use client';

import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerProvider';
import { Play, Pause, SkipForward, SkipBack, ChevronDown, Music, Disc3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TagEditor from './TagEditor';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url.startsWith('http') ? url : `/api${url}`).then(r => r.json());

export default function PlayerOverlay() {
  const { currentTrack, isPlaying, togglePlay, progress, seek, playNext, playPrevious } = useAudioPlayer();
  const [isExpanded, setIsExpanded] = useState(false);
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
    <>
      {/* ── MINI PLAYER ────────────────────────────────────── */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full cursor-pointer rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,13,26,0.92)',
              border: '1px solid rgba(168,85,247,0.2)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(168,85,247,0.08)',
            }}
            onClick={() => setIsExpanded(true)}
          >
            {/* Progress bar */}
            <div className="h-0.5 w-full" style={{ background: 'rgba(139,92,246,0.15)' }}>
              <motion.div
                className="h-full"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                }}
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 gap-3">
              {/* Artwork thumb */}
              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))' }}>
                {isPlaying
                  ? <Disc3 size={18} className="animate-spin" style={{ color: '#a855f7', animationDuration: '3s' }} />
                  : <Music size={18} style={{ color: '#6b6b9a' }} />
                }
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#f1f0ff' }}>
                  {currentTrack.file_name}
                </p>
                <div className="flex gap-1.5 mt-0.5 overflow-hidden">
                  {localTags.length > 0
                    ? localTags.slice(0, 3).map(name => {
                        const tag = allTags.find((g: any) => g.name === name);
                        return (
                          <span key={name} className="text-[9px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background: tag?.is_permanent ? (tag.color || '#7c3aed') : 'rgba(139,92,246,0.1)',
                              color: tag?.is_permanent ? '#fff' : '#6b6b9a',
                            }}>
                            {name}
                          </span>
                        );
                      })
                    : <span className="text-[9px]" style={{ color: '#3d3d6b' }}>Aucun tag</span>
                  }
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); playPrevious(); }}
                  className="p-2 rounded-lg transition-colors" style={{ color: '#6b6b9a' }}>
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(); }}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    boxShadow: '0 0 15px rgba(168,85,247,0.4)',
                    color: '#fff',
                  }}
                >
                  {isPlaying
                    ? <Pause size={15} fill="currentColor" />
                    : <Play size={15} fill="currentColor" className="ml-0.5" />
                  }
                </button>
                <button onClick={e => { e.stopPropagation(); playNext(); }}
                  className="p-2 rounded-lg transition-colors" style={{ color: '#6b6b9a' }}>
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL SCREEN PLAYER ─────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 250, damping: 32 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            style={{ background: '#06060e' }}
          >
            {/* Ambient glow behind artwork */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
                style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 right-0 w-[400px] h-[300px]"
                style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
            </div>

            {/* Content */}
            <div className="relative flex flex-col h-full pt-12 pb-8 px-6 md:px-20 max-w-lg mx-auto w-full">

              {/* Header */}
              <div className="flex items-center justify-between mb-10 shrink-0">
                <button onClick={() => setIsExpanded(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a855f7' }}>
                  <ChevronDown size={22} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#3d3d6b' }}>
                  En Lecture
                </span>
                <div className="w-10" />
              </div>

              {/* Artwork */}
              <div className="relative w-full aspect-square max-w-[260px] mx-auto mb-8 shrink-0">
                {/* Outer glow ring */}
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
                    ? <Disc3 size={72} className="animate-spin" style={{ color: 'rgba(168,85,247,0.6)', animationDuration: '4s' }} />
                    : <Music size={72} style={{ color: 'rgba(139,92,246,0.3)' }} />
                  }
                </div>
              </div>

              {/* Track name */}
              <div className="text-center mb-6 shrink-0">
                <h2 className="text-xl font-bold line-clamp-2 leading-tight" style={{ color: '#f1f0ff' }}>
                  {currentTrack.file_name}
                </h2>
              </div>

              {/* Tag Editor */}
              <div className="flex-1 overflow-y-auto mb-6 min-h-[120px]">
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <TagEditor
                    track={currentTrack}
                    localTags={localTags}
                    allTags={allTags}
                    onSaveTags={saveMetadata}
                    embedded={true}
                    onClose={() => {}}
                  />
                </div>
              </div>

              {/* Scrubber */}
              <div className="shrink-0">
                <div className="flex items-center gap-3 text-xs font-medium mb-6" style={{ color: '#3d3d6b' }}>
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
                    className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#a855f7' }}
                  />
                  <span className="w-10">{displayTime(durationSec || 0)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-10">
                  <button onClick={playPrevious}
                    className="p-3 rounded-full transition-all active:scale-90"
                    style={{ color: '#6b6b9a' }}>
                    <SkipBack size={26} />
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
                    className="p-3 rounded-full transition-all active:scale-90"
                    style={{ color: '#6b6b9a' }}>
                    <SkipForward size={26} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
