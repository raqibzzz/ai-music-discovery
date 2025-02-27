// src/components/ui/DashboardLayout.tsx
'use client';

import React from 'react';
import { MessageCircle, Clock, Music, ThumbsUp, Send, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useChat } from '../../../hooks/useChat';
import { useRecentlyPlayed } from '../../../hooks/useRecentlyPlayed';




interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SuggestedTrackProps {
  title: string;
  artist: string;
  album?: string;
}

interface HistoryTrackProps {
  title: string;
  artist: string;
  timestamp: string;
}

const SuggestedTrack: React.FC<SuggestedTrackProps> = ({ title, artist, album }) => (
  <div className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 p-2 rounded-lg transition-colors">
    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
      <Music size={16} />
    </div>
    <div>
      <div className="font-medium text-white">{title}</div>
      <div className="text-sm text-gray-400">{artist} {album && `• ${album}`}</div>
    </div>
  </div>
);

const HistoryTrack: React.FC<HistoryTrackProps> = ({ title, artist, timestamp }) => (
  <div className="flex items-center space-x-3 text-gray-300 hover:bg-gray-800 p-2 rounded-lg transition-colors">
    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
      <Music size={16} />
    </div>
    <div className="flex-1">
      <div className="font-medium text-white">{title}</div>
      <div className="text-sm text-gray-400">{artist}</div>
    </div>
    <div className="text-xs text-gray-500">{timestamp}</div>
  </div>
);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    handleSubmit,
    handleKeyPress
  } = useChat();

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
      <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6">
        <h1 className="text-xl font-bold text-white">Music Discovery</h1>
        <div className="ml-auto flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Music size={20} />
          </button>
          <button 
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg bg-gray-800"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
        </div>
      </header>

            <div className="flex-1 overflow-hidden flex">
        <main className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-black p-6">
          <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.type === 'user' ? 'items-start' : 'items-end'
                } space-y-2`}
              >
                <div
                  className={`rounded-lg p-4 max-w-xl ${
                    message.type === 'user' ? 'bg-gray-800' : 'bg-purple-600'
                  }`}
                >
                  <p className={message.type === 'user' ? 'text-gray-300' : 'text-white'}>
                    {message.content}
                  </p>
                </div>

                {message.suggestions && (
                  <div className="bg-gray-800 rounded-lg p-4 w-full max-w-xl">
                    <div className="space-y-3">
                      {message.suggestions.map((track) => (
                        <SuggestedTrack
                          key={track.id}
                          title={track.title}
                          artist={track.artist}
                          album={track.album}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for music recommendations..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`p-2 bg-purple-600 rounded-lg text-white transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </main>

        {/* Right Sidebar - History */}
        <aside className="w-80 bg-gray-900 p-6 space-y-6 overflow-y-auto">
    <section>
      <h2 className="text-white font-semibold mb-4 flex items-center">
        <Clock size={18} className="mr-2" />
        Recently Played
      </h2>
      <div className="space-y-3">
        {tracksLoading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : tracksError ? (
          <div className="text-red-400 text-sm">Error loading recent tracks</div>
        ) : recentTracks.length === 0 ? (
          <div className="text-gray-400 text-sm">No recently played tracks</div>
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

          {/* Suggested History */}
          <section>
            <h2 className="text-white font-semibold mb-4 flex items-center">
              <ThumbsUp size={18} className="mr-2" />
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
        </aside>
      </div>

      {/* Player Bar */}
      <div className="h-16 bg-gray-900 border-t border-gray-800">
        {/* Player controls will go here */}
      </div>
    </div>
  );
};

export default DashboardLayout;