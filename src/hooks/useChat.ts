// src/hooks/useChat.ts
import { useState } from 'react';
import { useSpotify } from './useSpotify';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: SpotifyTrack[];
}

interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { searchTracks, getRecommendations } = useSpotify();
  // Using session for authentication but not destructuring to avoid unused variable warnings
  useSession();

  // Helper function to extract track names from AI response
  const extractTrackNames = (text: string) => {
    // Look for patterns like "Artist - Song" or mentions of songs by artists
    const songMatches = text.match(/["'](.+?)["']|(\w+)\s*-\s*(\w+)/g) || [];
    return songMatches.map(match => match.replace(/["']/g, '').trim());
  };

  const processMessage = async (userMessage: string) => {
    try {
      setIsLoading(true);

      // Add user message to chat
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage
      };
      setMessages(prev => [...prev, newUserMessage]);

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(newUserMessage).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const aiResponse = await response.json();
      
      // Extract potential track names from AI response
      const trackNames = extractTrackNames(aiResponse.content);
      
      // Search for tracks and get recommendations
      let suggestions: SpotifyTrack[] = [];
      if (trackNames.length > 0) {
        const searchResults = await Promise.all(
          trackNames.map(track => searchTracks(track))
        );
        
        // Get recommendations based on the found tracks
        const trackIds = searchResults
          .flat()
          .slice(0, 2)
          .map(track => track.id);
          
        if (trackIds.length > 0) {
          suggestions = await getRecommendations(trackIds);
        }
      }

      // Add AI response with suggestions
      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        suggestions
      };
      setMessages(prev => [...prev, newAiMessage]);

    } catch (error) {
      console.error('Error processing message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    await processMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    handleSubmit,
    handleKeyPress
  };
}