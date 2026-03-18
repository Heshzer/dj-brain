'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

interface Track {
  id: string;
  file_name: string;
  server_path: string;
  duration_ms: number;
  tags: { id: string; name: string; color: string }[];
  notes: string;
  sync_status: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playlist: Track[];
  playTrack: (track: Track, contextPlaylist?: Track[]) => void;
  togglePlay: () => void;
  seek: (position: number) => void;
  setVolume: (level: number) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [howl, setHowl] = useState<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playlist, setPlaylist] = useState<Track[]>([]);

  useEffect(() => {
    let animationFrameId: number;
    
    const updateProgress = () => {
      if (howl && isPlaying) {
        const seek = howl.seek();
        if (typeof seek === 'number') {
          setProgress(seek);
        }
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [howl, isPlaying]);

  const playNext = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      playTrack(playlist[currentIndex + 1]);
    } else if (playlist.length > 0) {
      // Loop back to start
      playTrack(playlist[0]);
    }
  }, [currentTrack, playlist]);

  const playPrevious = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;
    
    // Si on a passé 3 secondes de lecture, on remet le titre au début
    if (progress > 3 && howl) {
      seek(0);
      return;
    }
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(playlist[currentIndex - 1]);
    }
  }, [currentTrack, playlist, progress, howl]);

  const playTrack = useCallback((track: Track, contextPlaylist?: Track[]) => {
    if (howl) {
      howl.unload();
    }
    
    // Update playlist context if provided
    if (contextPlaylist) {
      setPlaylist(contextPlaylist);
    }

    // Le streaming depuis le backend, utilisera la constante route complète si déployé avec une URL
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
    const streamUrl = `${API_BASE}/tracks/${track.id}/stream`;
    
    const newHowl = new Howl({
      src: [streamUrl],
      format: ['mp3', 'flac', 'wav', 'aiff'], // Howler is smart enough, but specify default
      html5: true, // IMPORTANT FOR STREAMING LARGE FILES GAPLESSLY
      volume: volume,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        // FIXME: Ne passons pas au suivant automatiquement pour l'instant
        // we'll defer to the Next button for DJing
      },
      onstop: () => setIsPlaying(false),
    });

    setHowl(newHowl);
    setCurrentTrack(track);
    newHowl.play();
  }, [howl, volume]);

  const togglePlay = () => {
    if (!howl) return;
    if (isPlaying) {
      howl.pause();
    } else {
      howl.play();
    }
  };

  const seek = (position: number) => {
    if (howl) {
      howl.seek(position);
      setProgress(position);
    }
  };

  const setVolume = (level: number) => {
    if (howl) howl.volume(level);
    setVolumeState(level);
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack, isPlaying, progress, volume, playlist,
      playTrack, togglePlay, seek, setVolume, playNext, playPrevious
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
