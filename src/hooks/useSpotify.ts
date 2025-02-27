// src/hooks/useSpotify.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import * as spotifyApi from '../lib/spotify';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
}

export function useSpotify() {
  const { data: session } = useSession();
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const fetchUserTopTracks = useCallback(async () => {
    try {
      setIsLoading(true);
      const tracks = await spotifyApi.getUserTopTracks(session);
      setTopTracks(tracks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch top tracks');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const getRecommendations = async (trackIds: string[]) => {
    try {
      const recommendations = await spotifyApi.getRecommendations(session, trackIds);
      setError(null);
      return recommendations;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      return [];
    }
  };

  const searchTracks = async (query: string) => {
    try {
      const results = await spotifyApi.searchTracks(session, query);
      setError(null);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search tracks');
      return [];
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserTopTracks();
    }
  }, [session, fetchUserTopTracks]);

  return {
    topTracks,
    isLoading,
    error,
    getRecommendations,
    searchTracks,
    refreshTopTracks: fetchUserTopTracks
  };
}