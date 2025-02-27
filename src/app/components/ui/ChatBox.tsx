'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Music, Sparkles } from 'lucide-react';
import { useChat } from '../../../hooks/useChat';
import { Button } from './button';
import { Card, CardContent } from './card';
import TextAnimation from './TextAnimation';

interface SuggestedTrackProps {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
}

const SuggestedTrack: React.FC<SuggestedTrackProps> = ({ title, artist, album }) => (
  <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
    <CardContent className="p-2 flex items-center">
      <div className="w-8 h-8 flex-shrink-0 rounded bg-zinc-700 flex items-center justify-center mr-2">
        <Music className="text-[#1DB954] w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium text-xs truncate">{title}</h4>
        <p className="text-zinc-400 text-xs truncate">{artist}{album ? ` • ${album}` : ''}</p>
      </div>
    </CardContent>
  </Card>
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
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-2 px-1 space-y-3">
        {showWelcome ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-2">
            <Sparkles size={42} className="text-[#1DB954] mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Music Assistant</h2>
            <p className="text-zinc-400 mb-4">
              Discover new music based on your taste and get personalized recommendations. 
              Ask about artists, genres, or moods to explore music you&apos;ll love.
            </p>
            
            <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700 w-full max-w-md">
              <p className="text-sm text-zinc-300 font-medium mb-2">Start by asking for recommendations or exploring your favorite genres.</p>
              <div className="space-y-1">
                <div onClick={() => setInputValue("Recommend songs similar to Radiohead's 'Creep'")} 
                  className="text-xs text-zinc-400 p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 cursor-pointer transition-colors">
                  Recommend songs similar to Radiohead&apos;s &quot;Creep&quot;
                </div>
                <div onClick={() => setInputValue("What are some good study music playlists?")} 
                  className="text-xs text-zinc-400 p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 cursor-pointer transition-colors">
                  What are some good study music playlists?
                </div>
                <div onClick={() => setInputValue("Help me discover 90s hip hop artists")} 
                  className="text-xs text-zinc-400 p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 cursor-pointer transition-colors">
                  Help me discover 90s hip hop artists
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    message.role === 'assistant' 
                      ? 'bg-zinc-800 text-white rounded-tl-none border-zinc-700 border' 
                      : 'bg-[#1DB954] text-zinc-900 rounded-tr-none'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <TextAnimation 
                      content={message.content} 
                      className="text-sm" 
                      speed={15} 
                    />
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  )}
                  
                  {/* Display song suggestions if any */}
                  {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-zinc-400 mb-1">Suggested tracks:</p>
                      {message.suggestions.slice(0, 3).map((track, index) => (
                        <SuggestedTrack 
                          key={`${track.id}-${index}`}
                          title={track.title}
                          artist={track.artist}
                          album={track.album}
                          albumArt={track.albumArt}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Chat Input */}
      <div className="p-2 bg-zinc-900 border-t border-zinc-800 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about artists, genres, or moods..."
            className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-[#1DB954] text-sm border border-zinc-700"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-[#1DB954] hover:bg-[#19a348] text-black rounded-full p-2 h-9 w-9 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={16} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox; 