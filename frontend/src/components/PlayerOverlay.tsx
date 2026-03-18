'use client';

import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerProvider';
import { Play, Pause, SkipForward, SkipBack, ChevronDown, Music, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import TagEditor from './TagEditor';
import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const fetcher = (url: string) => fetch(`${url.startsWith('http') ? '' : API_BASE}${url}`).then(r => r.json());

export default function PlayerOverlay() {
  const { currentTrack, isPlaying, togglePlay, progress, seek, playNext, playPrevious, volume, setVolume } = useAudioPlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tempProgress, setTempProgress] = useState(0);

  // We need allTags to pass into the TagEditor
  const { data: allTags = [] } = useSWR('/tags', fetcher, {
    refreshInterval: 10000
  });
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentTrack) {
      setLocalTags(currentTrack.tags?.map(t => t.name) || []);
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const durationSec = currentTrack.duration_ms ? currentTrack.duration_ms / 1000 : 0;
  const currentProgress = isDragging ? tempProgress : progress;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempProgress(parseFloat(e.target.value));
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

  const saveMetadata = async (newTags: string[]) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/tracks/${currentTrack.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      });
      if (response.ok) {
        setLocalTags(newTags);
      }
    } catch (e) {
      console.error('Failed to save metadata');
    }
    setIsSaving(false);
  };

  return (
    <>
      <AnimatePresence>
        {/* MINI PLAYER BAR (When not expanded) */}
        {!isExpanded && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 md:left-24 md:right-24 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl z-40 overflow-hidden cursor-pointer flex flex-col"
            onClick={() => setIsExpanded(true)}
          >
            {/* Progress line at the very top of mini player */}
            <div className="h-1 w-full bg-zinc-800">
               <div 
                 className="h-full bg-purple-500 transition-all duration-300"
                 style={{ width: `${durationSec > 0 ? (currentProgress / durationSec) * 100 : 0}%` }}
               />
            </div>
            
            <div className="flex items-center justify-between p-3 px-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                  <Music className="text-zinc-500" size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{currentTrack.file_name}</h3>
                  <div className="flex gap-1.5 mt-0.5 truncate overflow-hidden">
                    {localTags.length > 0 ? localTags.map(tagName => {
                      const tagObj = allTags.find((gt: any) => gt.name === tagName);
                      const isPerm = tagObj?.is_permanent;
                      const bgColor = isPerm ? (tagObj?.color || '#444444') : 'transparent';
                      const textColor = isPerm ? '#ffffff' : '#a1a1aa';
                      return (
                        <span key={tagName} className="text-[9px] px-1.5 py-0.5 outline outline-1 outline-zinc-700/50 rounded-full truncate" style={{ backgroundColor: bgColor, color: textColor }}>
                          {tagName}
                        </span>
                      );
                    }).slice(0, 3) : <span className="text-[10px] text-zinc-500">Aucun tag</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                 <button 
                  onClick={(e) => { e.stopPropagation(); playPrevious(); }}
                  className="p-2 text-zinc-400 hover:text-white"
                 ><SkipBack size={18} /></button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
                 >
                   {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                 </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); playNext(); }}
                  className="p-2 text-zinc-400 hover:text-white"
                 ><SkipForward size={18} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* FULL SCREEN EXPANDED PLAYER */}
        {isExpanded && (
          <motion.div
            initial={{ y: "100%", borderRadius: "2rem" }}
            animate={{ y: 0, borderRadius: "0rem" }}
            exit={{ y: "100%", borderRadius: "2rem" }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className="fixed inset-0 bg-zinc-950 z-50 flex flex-col pt-12 pb-8 px-6 overflow-hidden md:px-24"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 shrink-0">
              <button 
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition"
              >
                <ChevronDown size={24} />
              </button>
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">En Lecture</div>
              <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Artwork Area (Generative/Placeholder) */}
            <div className="w-full aspect-square max-w-[320px] mx-auto bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl shadow-2xl flex items-center justify-center mb-8 shrink-0 relative overflow-hidden">
               <Music size={80} className="text-zinc-700/50" />
               {/* Animated rings when playing */}
               {isPlaying && (
                 <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0.1 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 border-4 border-white rounded-3xl pointer-events-none"
                 />
               )}
            </div>

            {/* Track Info */}
            <div className="mb-6 shrink-0 text-center">
              <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 leading-tight">{currentTrack.file_name}</h2>
              {/* If sync pending indicator could go here */}
            </div>

            {/* TAG EDITOR DIRECTLY INTEGRATED IN PLAYER */}
            <div className="flex-1 overflow-y-auto mb-6 px-1 custom-scrollbar min-h-[150px]">
               {/* Re-use the TagEditor logic but without the absolute overlay styles, embed it here */}
               <div className="bg-zinc-900/50 rounded-3xl p-4 border border-zinc-800/50">
                  <TagEditor 
                    track={currentTrack}
                    localTags={localTags}
                    allTags={allTags}
                    onSaveTags={saveMetadata}
                    embedded={true} // Add this prop to modify TagEditor look
                    onClose={() => {}} // No close button needed in embedded mode
                  />
               </div>
            </div>

            {/* Playback Controls Footer */}
            <div className="shrink-0 mt-auto">
              {/* Scrubber */}
              <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium mb-6">
                <span className="w-10 text-right">{displayTime(currentProgress)}</span>
                <input
                  type="range"
                  min={0}
                  max={durationSec || currentProgress + 10}
                  step={0.1}
                  value={currentProgress}
                  onChange={handleSeek}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={handleSeekEnd}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={handleSeekEnd}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="w-10">{displayTime(durationSec || 0)}</span>
              </div>

              {/* Main Buttons */}
              <div className="flex items-center justify-center gap-8 mb-4">
                <button onClick={playPrevious} className="p-3 text-zinc-400 hover:text-white transition-colors active:scale-95">
                  <SkipBack size={28} />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform shadow-xl shadow-white/10 active:scale-95"
                >
                  {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={playNext} className="p-3 text-zinc-400 hover:text-white transition-colors active:scale-95">
                  <SkipForward size={28} />
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
