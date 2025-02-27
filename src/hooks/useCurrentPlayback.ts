import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
  uri: string;
}

export function useCurrentPlayback() {
  const { data: session, status, update } = useSession();
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  
  // Add cache for requests
  const lastFetchRef = useRef<number>(0);
  const minFetchInterval = useRef<number>(1000); // Minimum 1 second between API calls
  const consecutiveErrorsRef = useRef<number>(0);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCurrentPlayback = useCallback(async (force = false) => {
    if (!session?.accessToken) {
      if (status === 'authenticated') {
        // There is a session but no access token, likely needs refresh
        setNeedsReauth(true);
      }
      return;
    }
    
    // Implement rate limiting
    const now = Date.now();
    if (!force && now - lastFetchRef.current < minFetchInterval.current) {
      return; // Skip this fetch to avoid hitting rate limits
    }
    
    lastFetchRef.current = now;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        'https://api.spotify.com/v1/me/player',
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Reset consecutive errors on successful response
      if (response.status !== 429) {
        consecutiveErrorsRef.current = 0;
      }

      // If no track is playing, Spotify returns a 204 with no content
      if (response.status === 204) {
        if (isMountedRef.current) {
          setCurrentTrack(null);
        }
        return;
      }

      // Handle 401 Unauthorized - token needs refresh
      if (response.status === 401) {
        console.log('Token expired, attempting to refresh...');
        if (isMountedRef.current) {
          setNeedsReauth(true);
        }
        
        // Wait for token refresh and try again
        await update(); // Force session refresh
        throw new Error('Authentication error - please try again');
      }

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
        
        // Increase consecutive errors count
        consecutiveErrorsRef.current += 1;
        
        // Implement exponential backoff
        minFetchInterval.current = Math.min(
          30000, // Max 30 seconds
          1000 * Math.pow(2, Math.min(5, consecutiveErrorsRef.current))
        );
        
        console.log(`Rate limited. Waiting ${retryAfter}s before retrying. New min interval: ${minFetchInterval.current}ms`);
        
        throw new Error(`429: Too many requests to Spotify API. Retrying in ${retryAfter} seconds.`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.item) {
        if (isMountedRef.current) {
          setCurrentTrack(null);
        }
        return;
      }

      if (isMountedRef.current) {
        setCurrentTrack({
          id: data.item.id,
          title: data.item.name,
          artist: data.item.artists.map((a: { name: string }) => a.name).join(', '),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url,
          duration: data.item.duration_ms,
          progress: data.progress_ms || 0,
          isPlaying: data.is_playing,
          uri: data.item.uri
        });
      }
    } catch (err) {
      console.error('Error fetching current playback:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch current playback');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [session, status, update]);

  // Handle reauth if needed
  useEffect(() => {
    if (needsReauth && status === 'authenticated') {
      // Force a session refresh
      update();
      setNeedsReauth(false);
    }
  }, [needsReauth, status, update]);

  // Control functions with improved error handling
  const playPause = async () => {
    if (!session?.accessToken || !currentTrack) return;
    
    try {
      const endpoint = currentTrack.isPlaying ? 
        'https://api.spotify.com/v1/me/player/pause' : 
        'https://api.spotify.com/v1/me/player/play';
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        // Token likely expired, trigger a refresh
        setNeedsReauth(true);
        return;
      }
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
        throw new Error(`429: Too many requests to Spotify API. Retrying in ${retryAfter} seconds.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        
        // Check for common playback errors
        if (response.status === 403) {
          throw new Error('Premium required or no active device found. Please open Spotify on a device first.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setCurrentTrack(prev => prev ? {
          ...prev,
          isPlaying: !prev.isPlaying
        } : null);
      }
      
      // Fetch latest state after a short delay
      setTimeout(() => fetchCurrentPlayback(true), 500);
    } catch (err) {
      console.error('Error controlling playback:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to control playback');
      }
      fetchCurrentPlayback(true); // Refresh to ensure UI is in sync
    }
  };

  const skipNext = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        setNeedsReauth(true);
        return;
      }
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
        throw new Error(`429: Too many requests to Spotify API. Retrying in ${retryAfter} seconds.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 403) {
          throw new Error('Premium required or no active device found. Please open Spotify on a device first.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      // Wait a moment for Spotify to update
      setTimeout(() => fetchCurrentPlayback(true), 500);
    } catch (err) {
      console.error('Error skipping to next track:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to skip to next track');
      }
    }
  };

  const skipPrevious = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        setNeedsReauth(true);
        return;
      }
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
        throw new Error(`429: Too many requests to Spotify API. Retrying in ${retryAfter} seconds.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 403) {
          throw new Error('Premium required or no active device found. Please open Spotify on a device first.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      // Wait a moment for Spotify to update
      setTimeout(() => fetchCurrentPlayback(true), 500);
    } catch (err) {
      console.error('Error skipping to previous track:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to skip to previous track');
      }
    }
  };

  // Seek to position with updated error handling
  const seekToPosition = async (positionMs: number) => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, 
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.status === 401) {
        setNeedsReauth(true);
        return;
      }
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
        throw new Error(`429: Too many requests to Spotify API. Retrying in ${retryAfter} seconds.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 403) {
          throw new Error('Premium required or no active device found. Please open Spotify on a device first.');
        } else {
          throw new Error(errorMessage);
        }
      }
      
      // Update local state optimistically
      if (isMountedRef.current) {
        setCurrentTrack(prev => prev ? {
          ...prev,
          progress: positionMs
        } : null);
      }
      
      // Fetch latest state after a short delay
      setTimeout(() => fetchCurrentPlayback(true), 500);
    } catch (err) {
      console.error('Error seeking to position:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to seek to position');
      }
    }
  };

  // Fetch current playback when session is available and handle errors
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchCurrentPlayback();
      
      // Set up polling for playback state with adaptive interval
      const intervalId = setInterval(() => {
        fetchCurrentPlayback();
      }, 10000); // Poll every 10 seconds (increased from 5 for less API usage)
      
      return () => clearInterval(intervalId);
    }
  }, [session, status, fetchCurrentPlayback]);

  return {
    currentTrack,
    isLoading,
    error,
    playPause,
    skipNext,
    skipPrevious,
    seekToPosition,
    refreshPlayback: () => fetchCurrentPlayback(true),
    needsReauth
  };
} 