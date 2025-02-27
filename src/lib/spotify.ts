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
  
  console.log(`Fetching: ${url.split('?')[0]}`); // Log the endpoint without query params
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Token might be expired');
      } else if (response.status === 404) {
        // Log more details for 404 errors to help diagnose the issue
        console.error(`404 Not Found error for URL: ${url.split('?')[0]}`);
        throw new Error(`Spotify API endpoint not found (404): ${url.split('?')[0]}`);
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limited by Spotify API (429). Retry after ${retryAfter} seconds.`);
      }
      
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorResponse = await response.json();
        errorDetails = ` - ${JSON.stringify(errorResponse)}`;
      } catch {
        // Couldn't parse error response, continue without details
      }
      
      throw new Error(`Spotify API error: ${response.status}${errorDetails}`);
    }

    return response.json();
  } catch (error) {
    // Rethrow fetch errors (like network errors) with more context
    if (!(error instanceof Error && error.message.includes('Spotify API'))) {
      console.error('Fetch error in spotifyFetch:', error);
      throw new Error(`Spotify API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
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

  if (!seedTracks || seedTracks.length === 0) {
    console.warn('No seed tracks provided for recommendations');
    return []; // Return empty array instead of throwing an error
  }

  try {
    // Make sure we have valid track IDs - using only alphanumeric IDs to avoid encoding issues
    const validTrackIds = seedTracks
      .filter(id => id && typeof id === 'string')
      .filter(id => /^[a-zA-Z0-9]+$/.test(id)); // Only allow alphanumeric IDs
    
    if (validTrackIds.length === 0) {
      console.warn('No valid track IDs for recommendations');
      return [];
    }
    
    // Take only 2 track IDs to keep the URL shorter
    const limitedTrackIds = validTrackIds.slice(0, 2);
    
    // Simple direct URL construction - Spotify expects comma-separated values
    const url = `${SPOTIFY_BASE_URL}/recommendations?seed_tracks=${limitedTrackIds.join(',')}&market=US&limit=10`;
    
    console.log('Final recommendations URL:', url);
    
    const data = await spotifyFetch(
      url,
      session.accessToken
    );
    
    if (!data.tracks || !Array.isArray(data.tracks)) {
      console.error('Invalid response from Spotify recommendations API:', data);
      return [];
    }

    return data.tracks.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
}

export async function searchTracks(session: Session | null, query: string) {
  if (!session?.accessToken) {
    console.warn('No access token available for search');
    return [];
  }

  if (!query || query.trim().length === 0) {
    console.warn('Empty search query');
    return [];
  }

  try {
    // Clean up the query - remove special characters that might cause issues
    const cleanQuery = query.trim().replace(/[^\w\s&'"-]/g, ' ').trim();
    
    if (cleanQuery.length === 0) {
      console.warn('Search query contained only special characters');
      return [];
    }
    
    const params = new URLSearchParams({
      q: cleanQuery,
      type: 'track',
      limit: '10',
      market: 'US' // Add market parameter for more consistent results
    });

    console.log(`Searching for tracks: "${cleanQuery}"`);
    
    const data = await spotifyFetch(
      `${SPOTIFY_BASE_URL}/search?${params}`,
      session.accessToken
    );

    if (!data.tracks || !data.tracks.items || !Array.isArray(data.tracks.items)) {
      console.warn('Invalid search response structure:', data);
      return [];
    }

    return data.tracks.items.map((track: SpotifyTrack) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumArt: track.album.images[0]?.url
    }));
  } catch (error) {
    console.error('Error searching tracks:', error);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
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