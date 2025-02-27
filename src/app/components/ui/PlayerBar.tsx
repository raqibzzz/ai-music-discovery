'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useCurrentPlayback } from '../../../hooks/useCurrentPlayback';
import { Button } from './button';
import { Card } from './card';

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
  }, [error, retryCount, refreshPlayback]);

  // Update progress bar
  useEffect(() => {
    if (!currentTrack || !currentTrack.progress || !currentTrack.duration || isDragging) return;
    
    setLocalProgress(currentTrack.progress);
    setProgressPercent((currentTrack.progress / currentTrack.duration) * 100);
    
    // If track is playing, update progress in real time
    if (currentTrack.isPlaying) {
      const interval = setInterval(() => {
        setLocalProgress(prev => {
          const newProgress = prev + 1000;
          if (newProgress <= currentTrack.duration) {
            setProgressPercent((newProgress / currentTrack.duration) * 100);
            return newProgress;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentTrack, isDragging]);

  // Format time in mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle seeking on progress bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setProgressPercent(value);
    setIsDragging(true);
    if (currentTrack) {
      setLocalProgress((value / 100) * currentTrack.duration);
    }
  };

  // Send seek command to Spotify
  const handleSeekComplete = () => {
    setIsDragging(false);
    if (currentTrack) {
      const position = Math.floor((progressPercent / 100) * currentTrack.duration);
      seekToPosition(position);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Would implement actual mute functionality here if the Spotify Web API supported it
  };

  const handleRetry = () => {
    setDisplayError(null);
    setHasRateLimitError(false);
    refreshPlayback();
  };

  const handleOpenSpotify = () => {
    if (currentTrack) {
      window.open(`https://open.spotify.com/track/${currentTrack.id}`, '_blank');
    }
  };

  // Base player that shows even when no track is playing
  const renderEmptyPlayer = () => (
    <div className="h-full flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-md flex items-center justify-center">
          <AlertCircle size={18} className="text-zinc-400" />
        </div>
        <div>
          <div className="text-zinc-300 font-medium">Not playing</div>
          <div className="text-xs text-zinc-500">No active Spotify session detected</div>
        </div>
      </div>
      
      <div className="flex items-center">
        <Button
          onClick={refreshPlayback}
          variant="secondary"
          size="sm"
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          <RefreshCw size={16} />
        </Button>
      </div>
    </div>
  );

  // Player with error state
  const renderErrorState = () => (
    <div className="h-full flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-red-900/30 rounded-md flex items-center justify-center">
          <AlertCircle size={18} className="text-red-400" />
        </div>
        <div className="flex-1">
          <div className="text-zinc-300 font-medium">Playback error</div>
          <div className="text-xs text-red-400 max-w-xs truncate">{displayError || 'Connection error with Spotify'}</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {needsReauth && (
          <Button
            onClick={() => window.location.href = '/api/auth/signin?callbackUrl=/dashboard'}
            variant="secondary"
            size="sm"
            className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-black"
          >
            Reconnect
          </Button>
        )}
        
        <Button
          onClick={handleRetry}
          variant="secondary"
          size="sm"
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          disabled={hasRateLimitError}
        >
          <RefreshCw size={16} className={hasRateLimitError ? 'animate-spin' : ''} />
        </Button>
      </div>
    </div>
  );

  // Full featured player when a track is playing
  const renderPlayer = () => {
    if (!currentTrack) return renderEmptyPlayer();
    
    return (
      <div className="h-full flex items-center justify-between px-4">
        {/* Track info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {currentTrack.albumArt ? (
            <div className="w-10 h-10 relative rounded-md overflow-hidden shadow-lg flex-shrink-0">
              <Image 
                src={currentTrack.albumArt} 
                alt={`${currentTrack.album || 'Album cover'}`} 
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-zinc-800 rounded-md flex-shrink-0"></div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{currentTrack.title}</div>
            <div className="text-xs text-zinc-400 truncate">
              {currentTrack.artist}
            </div>
          </div>
        </div>
        
        {/* Playback controls */}
        <div className="flex flex-col justify-center items-center flex-1">
          <div className="flex items-center space-x-2 mb-1.5">
            <Button
              onClick={skipPrevious}
              variant="secondary"
              size="sm"
              className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 h-auto w-auto"
            >
              <SkipBack size={16} />
            </Button>
            
            <Button
              onClick={playPause}
              variant="secondary"
              size="sm"
              className="bg-white hover:bg-zinc-200 text-black p-1 h-8 w-8 rounded-full"
            >
              {currentTrack.isPlaying ? (
                <Pause size={16} className="ml-0.5" />
              ) : (
                <Play size={16} className="ml-0.5" />
              )}
            </Button>
            
            <Button
              onClick={skipNext}
              variant="secondary"
              size="sm"
              className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 h-auto w-auto"
            >
              <SkipForward size={16} />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center w-full max-w-xs space-x-2">
            <span className="text-xs text-zinc-400 w-8 text-right">
              {formatTime(localProgress)}
            </span>
            
            <div className="relative flex-1 h-1 group">
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={handleSeek}
                onMouseUp={handleSeekComplete}
                onTouchEnd={handleSeekComplete}
                className="absolute inset-0 w-full h-1 appearance-none bg-transparent z-10 cursor-pointer opacity-0"
                style={{ touchAction: 'none' }}
              />
              <div className="h-1 bg-zinc-800 rounded-full w-full absolute">
                <div 
                  className="h-full bg-[#1DB954] rounded-full absolute left-0 group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            
            <span className="text-xs text-zinc-400 w-8">
              {currentTrack.duration ? formatTime(currentTrack.duration) : '--:--'}
            </span>
          </div>
        </div>
        
        {/* Volume and external link */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <Button
            onClick={toggleMute}
            variant="secondary"
            size="sm"
            className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 h-auto w-auto"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <Button
            onClick={handleOpenSpotify}
            variant="secondary"
            size="sm"
            className="bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 h-auto w-auto"
          >
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-20 border-t border-zinc-800 bg-zinc-900 shadow-md rounded-none">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-zinc-800 border-t-[#1DB954] rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        renderErrorState()
      ) : currentTrack ? (
        renderPlayer()
      ) : (
        renderEmptyPlayer()
      )}
    </Card>
  );
};

export default PlayerBar; 