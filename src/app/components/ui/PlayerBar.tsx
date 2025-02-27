'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useCurrentPlayback } from '../../../hooks/useCurrentPlayback';

const PlayerBar: React.FC = () => {
  const { 
    currentTrack, 
    isLoading, 
    error,
    playPause, 
    skipNext, 
    skipPrevious, 
    seekToPosition,
    refreshPlayback,
    needsReauth
  } = useCurrentPlayback();
  
  const [progressPercent, setProgressPercent] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Handle rate limit errors
  useEffect(() => {
    if (error && error.includes('429')) {
      setHasRateLimitError(true);
      setDisplayError('Too many requests to Spotify API. Please wait a moment before retrying.');
      
      // Implement exponential backoff for retries
      const backoffTime = Math.min(30000, 1000 * Math.pow(2, retryCount));
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refreshPlayback();
      }, backoffTime);
      
      return () => clearTimeout(timer);
    } else if (error) {
      setDisplayError(error);
      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        setDisplayError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, refreshPlayback, retryCount]);

  // Reset retry count when connection is successful
  useEffect(() => {
    if (currentTrack && hasRateLimitError) {
      setHasRateLimitError(false);
      setRetryCount(0);
    }
  }, [currentTrack, hasRateLimitError]);

  // Handle reauth if needed
  useEffect(() => {
    if (needsReauth) {
      setDisplayError('Session expired. Please refresh the page or sign in again.');
    }
  }, [needsReauth]);

  // Update progress state when currentTrack changes
  useEffect(() => {
    if (!currentTrack || isDragging) return;
    
    setLocalProgress(currentTrack.progress);
    setProgressPercent((currentTrack.progress / currentTrack.duration) * 100);
    
    // Update progress periodically if track is playing
    if (currentTrack.isPlaying) {
      const interval = setInterval(() => {
        setLocalProgress(prev => {
          const newProgress = Math.min(prev + 1000, currentTrack.duration);
          setProgressPercent((newProgress / currentTrack.duration) * 100);
          return newProgress;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentTrack, isDragging]);

  // Format time (ms) to MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setProgressPercent(value);
    const newProgressMs = Math.floor((value / 100) * (currentTrack?.duration || 0));
    setLocalProgress(newProgressMs);
  };

  const handleSeekComplete = () => {
    if (currentTrack) {
      seekToPosition(localProgress);
      setIsDragging(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual Spotify mute functionality if needed
  };

  const handleRetry = () => {
    setDisplayError(null);
    refreshPlayback();
  };

  const handleOpenSpotify = () => {
    window.open('https://open.spotify.com', '_blank');
  };

  // Show error state
  if (displayError) {
    return (
      <div className="h-24 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-6">
        <div className="text-red-400 flex-1 flex items-center">
          <AlertCircle size={20} className="mr-3 flex-shrink-0"/>
          <div>
            <p className="font-medium">{displayError}</p>
            <p className="text-sm text-zinc-400 mt-1">
              {hasRateLimitError 
                ? `Retrying automatically in ${Math.min(30, Math.pow(2, retryCount))} seconds...` 
                : 'Make sure you have Spotify Premium and an active device.'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleRetry}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            disabled={hasRateLimitError}
          >
            <RefreshCw size={16} className={hasRateLimitError ? "animate-spin" : ""} />
            <span>Retry</span>
          </button>
          <button 
            onClick={handleOpenSpotify}
            className="bg-[#1DB954] hover:bg-[#1DB954]/80 text-black px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ExternalLink size={16} />
            <span>Open Spotify</span>
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading && !currentTrack) {
    return (
      <div className="h-24 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center px-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-[#1DB954] animate-pulse"></div>
          <p className="text-zinc-400">Connecting to Spotify...</p>
        </div>
      </div>
    );
  }

  // No track playing
  if (!currentTrack && !isLoading) {
    return (
      <div className="h-24 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-6">
        <p className="text-zinc-400">No track currently playing on Spotify</p>
        <button 
          onClick={handleOpenSpotify}
          className="bg-[#1DB954] hover:bg-[#1DB954]/80 text-black px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <ExternalLink size={16} />
          <span>Open Spotify</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-24 bg-zinc-950 border-t border-zinc-800 flex items-center px-6">
      {currentTrack && (
        <>
          {/* Track Info */}
          <div className="flex items-center w-1/4">
            <div className="relative w-16 h-16 rounded overflow-hidden mr-4 shadow-lg">
              {currentTrack.albumArt && (
                <Image 
                  src={currentTrack.albumArt} 
                  alt={`${currentTrack.album} cover`} 
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-medium truncate max-w-[240px]">{currentTrack.title}</span>
              <span className="text-zinc-400 text-sm truncate max-w-[240px]">{currentTrack.artist}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={skipPrevious}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <SkipBack size={22} />
              </button>
              <button 
                onClick={playPause}
                className="bg-white text-black hover:scale-105 transition-transform p-2 rounded-full"
              >
                {currentTrack.isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <button 
                onClick={skipNext}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <SkipForward size={22} />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-zinc-400 w-10 text-right">
                {formatTime(localProgress)}
              </span>
              <div className="relative flex-1 max-w-md">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={handleSeek}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={handleSeekComplete}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={handleSeekComplete}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                />
                <div 
                  className="absolute top-0 left-0 h-1.5 bg-[#1DB954] rounded-lg pointer-events-none" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs text-zinc-400 w-10">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="w-1/4 flex justify-end items-center">
            <button 
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition-colors mr-2"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerBar; 