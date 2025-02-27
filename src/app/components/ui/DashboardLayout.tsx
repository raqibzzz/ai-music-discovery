// src/components/ui/DashboardLayout.tsx
'use client';

import React from 'react';
import { Clock, Music, ThumbsUp, LogOut, Search, Disc3 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRecentlyPlayed } from '../../../hooks/useRecentlyPlayed';
import PlayerBar from './PlayerBar';
import ChatBox from './ChatBox';

interface HistoryTrackProps {
  title: string;
  artist: string;
  timestamp: string;
}

const HistoryTrack: React.FC<HistoryTrackProps> = ({ title, artist, timestamp }) => (
  <div className="flex items-center space-x-3 text-zinc-300 hover:bg-zinc-800 p-2 rounded-lg transition-colors">
    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
      <Music size={16} className="text-[#1DB954]" />
    </div>
    <div className="flex-1">
      <div className="font-medium text-white">{title}</div>
      <div className="text-sm text-zinc-400">{artist}</div>
    </div>
    <div className="text-xs text-zinc-500">{timestamp}</div>
  </div>
);

const DashboardLayout: React.FC = () => {
  const {
    recentTracks,
    isLoading: tracksLoading,
    error: tracksError,
    getRelativeTime
  } = useRecentlyPlayed();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center px-6 z-10 shadow-lg">
        <div className="flex items-center gap-2">
          <Disc3 size={28} className="text-[#1DB954]" />
          <h1 className="text-xl font-bold text-white">Music Discovery</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search tracks..."
              className="bg-zinc-800 text-white px-4 py-2 rounded-full w-48 focus:w-64 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1DB954] text-sm border border-zinc-700"
            />
            <Search size={18} className="absolute right-3 top-2.5 text-zinc-400 group-focus-within:text-[#1DB954]" />
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-zinc-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-zinc-800"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <span className="text-sm font-medium text-black">JD</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content with ChatBox */}
        <main className="flex-1 flex flex-col bg-zinc-950 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            {/* Empty space on larger screens */}
            <div className="hidden xl:block"></div>
            
            {/* ChatBox in the middle */}
            <div className="h-full">
              <ChatBox />
            </div>
            
            {/* Recently Played - Hidden on mobile */}
            <div className="hidden xl:block space-y-6">
              <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h2 className="text-white font-semibold mb-4 flex items-center">
                  <Clock size={18} className="mr-2 text-[#1DB954]" />
                  Recently Played
                </h2>
                <div className="space-y-3">
                  {tracksLoading ? (
                    <div className="text-zinc-400 text-sm p-3 bg-zinc-800 rounded-lg animate-pulse">Loading...</div>
                  ) : tracksError ? (
                    <div className="text-red-400 text-sm p-3 bg-zinc-800 rounded-lg">Error loading recent tracks</div>
                  ) : recentTracks.length === 0 ? (
                    <div className="text-zinc-400 text-sm p-3 bg-zinc-800 rounded-lg">No recently played tracks</div>
                  ) : (
                    recentTracks.slice(0, 5).map((track) => (
                      <HistoryTrack
                        key={`${track.id}-${track.playedAt.getTime()}`}
                        title={track.title}
                        artist={track.artist}
                        timestamp={getRelativeTime(track.playedAt)}
                      />
                    ))
                  )}
                </div>
              </section>

              <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h2 className="text-white font-semibold mb-4 flex items-center">
                  <ThumbsUp size={18} className="mr-2 text-[#1DB954]" />
                  Previous Suggestions
                </h2>
                <div className="space-y-3">
                  <HistoryTrack 
                    title="Bring the Sun"
                    artist="Low Roar"
                    timestamp="5 min ago"
                  />
                  <HistoryTrack 
                    title="Hide and Seek"
                    artist="Imogen Heap"
                    timestamp="5 min ago"
                  />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Player Bar */}
      <PlayerBar />
    </div>
  );
};

export default DashboardLayout;