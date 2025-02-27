// src/hooks/useRecentlyPlayed.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface RecentTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  playedAt: Date;
}

export function useRecentlyPlayed() {
  const { data: session } = useSession();
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentlyPlayed = async () => {
    if (!session?.accessToken) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=20',
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const formattedTracks = data.items.map((item: any) => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists[0].name,
        album: item.track.album.name,
        albumArt: item.track.album.images[0]?.url,
        playedAt: new Date(item.played_at)
      }));

      setRecentTracks(formattedTracks);
    } catch (err) {
      console.error('Error fetching recent tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent tracks');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format the relative time (e.g., "2 min ago")
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Fetch recently played tracks when session is available
  useEffect(() => {
    if (session?.accessToken) {
      fetchRecentlyPlayed();
    }
  }, [session]);

  // Optional: Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    if (!session?.accessToken) return;

    const intervalId = setInterval(() => {
      fetchRecentlyPlayed();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [session]);

  return {
    recentTracks,
    isLoading,
    error,
    refreshRecentTracks: fetchRecentlyPlayed,
    getRelativeTime
  };
}