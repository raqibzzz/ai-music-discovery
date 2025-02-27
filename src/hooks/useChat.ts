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
    // Remove any markdown formatting that might interfere with extraction
    const cleanedText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Better pattern matching for songs and artists with focus on quoted content
    const patterns = [
      /['"]([^'"]{3,50})['"](?!\s*\()/g,    // Anything in quotes, not followed by a parenthesis
      /(\w[\w\s&'.]{3,40}) by ([\w\s&'.]{3,30})/gi,  // "Song by Artist" format
      /([\w\s&'.]{3,30})\s+-\s+([\w\s&'.]{3,40})/g,  // Artist - Song format
      /\b([\w\s&'.]{3,50}) (song|track)\b/gi,      // Anything followed by "song" or "track"
    ];
    
    const matches: string[] = [];
    
    // Apply each pattern and collect results
    patterns.forEach(pattern => {
      const found = [...cleanedText.matchAll(pattern)];
      found.forEach(match => {
        // Get the first capturing group or the full match
        const extractedText = match[1] || match[0];
        if (extractedText && extractedText.length > 3 && extractedText.length < 100) { 
          matches.push(extractedText.trim());
        }
      });
    });
    
    // Handle special case for a list of songs
    // This is a simplified version to handle the format seen in the console
    if (matches.length === 0) {
      const songListMatch = cleanedText.match(/Here are .+?:\s*(?:\d+\.\s*)?(.+?)(?:,|\.|\n|$)/i);
      if (songListMatch && songListMatch[1]) {
        matches.push(songListMatch[1].trim());
      }
    }
    
    // Deduplicate and return
    return [...new Set(matches)];
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
        try {
          console.log("Extracted track names:", trackNames);
          
          // Gather all search results
          let allSearchResults: SpotifyTrack[] = [];
          for (const track of trackNames) {
            try {
              const results = await searchTracks(track);
              if (results && results.length > 0) {
                allSearchResults = [...allSearchResults, ...results];
              }
            } catch (error) {
              console.warn(`Search failed for track "${track}":`, error);
              // Continue with other tracks
            }
          }
          
          // Filter out duplicates by ID
          const uniqueResults = allSearchResults.filter((track, index, self) => 
            index === self.findIndex(t => t.id === track.id)
          );
          
          // Get recommendations based on the found tracks
          const trackIds = uniqueResults
            .slice(0, 5) // Spotify allows max 5 seed tracks
            .map(track => track.id);
            
          console.log("Found track IDs for recommendations:", trackIds);
            
          if (trackIds.length > 0) {
            suggestions = await getRecommendations(trackIds);
            console.log(`Got ${suggestions.length} recommendations`);
          } else {
            console.log("No valid track IDs found for recommendations");
          }
        } catch (error) {
          console.error("Error getting track recommendations:", error);
          // Continue with AI response without suggestions
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