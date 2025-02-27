'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Music, Sparkles } from 'lucide-react';
import { useChat } from '../../../hooks/useChat';

interface SuggestedTrackProps {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
}

const SuggestedTrack: React.FC<SuggestedTrackProps> = ({ title, artist, album }) => (
  <div className="flex items-center p-2 rounded-md hover:bg-gray-700 transition-colors">
    <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center mr-3">
      <Music className="text-[#1DB954] w-5 h-5" />
    </div>
    <div>
      <h4 className="text-white font-medium text-sm">{title}</h4>
      <p className="text-gray-400 text-xs">{artist}{album ? ` • ${album}` : ''}</p>
    </div>
  </div>
);

const ChatBox: React.FC = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    handleSubmit,
    handleKeyPress,
  } = useChat();
  
  // State to track if welcome message should be shown
  const [showWelcome, setShowWelcome] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Hide welcome message when messages exist or user is typing
  useEffect(() => {
    if (messages.length > 0 || inputValue.length > 0) {
      setShowWelcome(false);
    }
  }, [messages, inputValue]);

  return (
    <div className="flex flex-col h-full bg-black rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center">
        <div className="w-2 h-2 rounded-full bg-[#1DB954] mr-2 animate-pulse"></div>
        <h2 className="text-white font-medium">Music Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {showWelcome ? (
              <div className="max-w-lg">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 mx-auto">
                  <Sparkles className="text-[#1DB954] w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Welcome to Your Music Discovery</h1>
                <p className="text-zinc-400 mb-6">
                  Discover new music based on your taste and get personalized recommendations. 
                  Ask about artists, genres, or moods to explore music you'll love.
                </p>
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-6">
                  <p className="text-zinc-300 text-sm italic">
                    "Start by asking for recommendations or exploring your favorite genres. Try something like 'Recommend songs similar to [artist name]' or 'What are some good study music playlists?'"
                  </p>
                </div>
                <p className="text-zinc-500 text-sm">
                  Start typing in the chat below to begin your music journey!
                </p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                  <Music className="text-[#1DB954] w-8 h-8" />
                </div>
                <h3 className="text-white font-medium mb-2">Music Discovery Assistant</h3>
                <p className="text-zinc-400 max-w-md">
                  Ask me about music recommendations, genres, artists, or anything music-related!
                </p>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.role === 'user' ? 'items-start' : 'items-end'
              } space-y-2`}
            >
              <div
                className={`rounded-xl p-4 max-w-[85%] shadow-md ${
                  message.role === 'user' 
                    ? 'bg-zinc-800 text-zinc-100' 
                    : 'bg-[#1DB954]/10 border border-[#1DB954]/20 text-white'
                }`}
              >
                <p className="leading-relaxed text-sm">
                  {message.content}
                </p>
              </div>

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="bg-zinc-900 rounded-xl p-4 w-full max-w-[85%] shadow-md border border-zinc-800">
                  <h3 className="text-white font-medium mb-3 flex items-center text-sm">
                    <Music size={16} className="mr-2 text-[#1DB954]" />
                    Suggested Tracks
                  </h3>
                  <div className="space-y-2">
                    {message.suggestions.map((track) => (
                      <SuggestedTrack
                        key={track.id}
                        title={track.title}
                        artist={track.artist}
                        album={track.album}
                        albumArt={track.albumArt}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for music recommendations..."
            className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1DB954] placeholder-zinc-500 text-sm border border-zinc-700"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`p-3 rounded-lg text-white transition-all ${
              isLoading 
                ? 'bg-zinc-700 cursor-not-allowed' 
                : 'bg-[#1DB954] hover:bg-[#1DB954]/90'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox; 