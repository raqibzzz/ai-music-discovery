// src/lib/spotify.ts
import { Session } from 'next-auth';

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
}

interface RecentlyPlayedItem {
  track: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
  };
  played_at: string;
}


// Helper function to handle Spotify API calls
async function spotifyFetch(url: string, accessToken: string) {
  if (!accessToken) {
    throw new Error('No access token provided');
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Token might be expired');
    }
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json();
}

export async function getUserTopTracks(session: Session | null) {
  if (!session?.accessToken) {
    throw new Error('No access token available');
  }

  try {
    const data = await spotifyFetch(
      `${SPOTIFY_BASE_URL}/me/top/tracks?limit=20&time_range=short_term`,
      session.accessToken
    );
    
    return data.items.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url
    }));
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
}

export async function getRecommendations(session: Session | null, seedTracks: string[]) {
  if (!session?.accessToken) {
    throw new Error('No access token available');
  }

  try {
    const params = new URLSearchParams({
      seed_tracks: seedTracks.slice(0, 5).join(','), // Spotify allows max 5 seed tracks
      limit: '10'
    });

    const data = await spotifyFetch(
      `${SPOTIFY_BASE_URL}/recommendations?${params}`,
      session.accessToken
    );

    return data.tracks.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

export async function searchTracks(session: Session | null, query: string) {
  if (!session?.accessToken) {
    throw new Error('No access token available');
  }

  try {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '10'
    });

    const data = await spotifyFetch(
      `${SPOTIFY_BASE_URL}/search?${params}`,
      session.accessToken
    );

    return data.tracks.items.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url
    }));
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
}

export async function getRecentlyPlayed(session: Session | null, limit: number = 20) {
  if (!session?.accessToken) {
    throw new Error('No access token available');
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.items.map((item: RecentlyPlayedItem) => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0].name,
      album: item.track.album.name,
      albumArt: item.track.album.images[0]?.url,
      playedAt: new Date(item.played_at)
    }));
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    throw error;
  }
}