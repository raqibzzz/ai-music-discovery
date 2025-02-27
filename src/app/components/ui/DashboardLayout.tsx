// src/components/ui/DashboardLayout.tsx
'use client';

import React from 'react';
import { Clock, Music, ThumbsUp, LogOut, Search, Disc3, GripVertical } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRecentlyPlayed } from '../../../hooks/useRecentlyPlayed';
import PlayerBar from './PlayerBar';
import ChatBox from './ChatBox';
import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from 'react-resizable-panels';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface HistoryTrackProps {
  title: string;
  artist: string;
  timestamp: string;
}

const HistoryTrack: React.FC<HistoryTrackProps> = ({ title, artist, timestamp }) => (
  <div className="flex items-center space-x-2 text-zinc-300 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors">
    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
      <Music size={14} className="text-[#1DB954]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-white text-xs truncate">{title}</div>
      <div className="text-xs text-zinc-400 truncate">{artist}</div>
    </div>
    <div className="text-[10px] text-zinc-500 whitespace-nowrap">{timestamp}</div>
  </div>
);

// Custom resize handle component
const ResizeHandle = () => (
  <PanelResizeHandle className="w-1.5 mx-1 hover:w-2 hover:mx-0.75 transition-all duration-150 rounded-full flex justify-center items-center bg-zinc-800 hover:bg-[#1DB954] group">
    <GripVertical size={12} className="text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
  </PanelResizeHandle>
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
          <Button 
            onClick={handleSignOut}
            variant="secondary" 
            size="sm"
            className="text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <span className="text-sm font-medium text-black">JD</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content with Resizable Panels */}
        <main className="flex-1 flex flex-col bg-zinc-950 p-6 overflow-y-auto">
          <PanelGroup direction="horizontal" className="h-full">
            {/* ChatBox Panel */}
            <Panel defaultSize={75} minSize={20} className="h-full overflow-hidden">
              <Card className="h-full bg-zinc-900 border-zinc-800 shadow-md overflow-hidden">
                <CardContent className="p-0 h-full">
                  <ChatBox />
                </CardContent>
              </Card>
            </Panel>
            
            {/* Resize Handle */}
            <ResizeHandle />
            
            {/* Recently Played Panel */}
            <Panel defaultSize={25} minSize={15} className="h-full overflow-auto">
              <PanelGroup direction="vertical" className="h-full">
                <Panel defaultSize={50} minSize={15} className="overflow-hidden">
                  <Card className="h-full bg-zinc-900 border-zinc-800 shadow-md">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold text-white flex items-center">
                        <Clock size={16} className="mr-2 text-[#1DB954]" />
                        Recently Played
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-2">
                        {tracksLoading ? (
                          <div className="text-zinc-400 text-xs p-2 bg-zinc-800 rounded-lg animate-pulse">Loading...</div>
                        ) : tracksError ? (
                          <div className="text-red-400 text-xs p-2 bg-zinc-800 rounded-lg">Error loading recent tracks</div>
                        ) : recentTracks.length === 0 ? (
                          <div className="text-zinc-400 text-xs p-2 bg-zinc-800 rounded-lg">No recently played tracks</div>
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
                    </CardContent>
                  </Card>
                </Panel>
                
                {/* Horizontal Resize Handle */}
                <PanelResizeHandle className="h-1.5 my-1 hover:h-2 hover:my-0.75 transition-all duration-150 rounded-full flex flex-col justify-center items-center bg-zinc-800 hover:bg-[#1DB954] group">
                  <GripVertical size={12} className="rotate-90 text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </PanelResizeHandle>
                
                <Panel defaultSize={50} minSize={15} className="overflow-hidden">
                  <Card className="h-full bg-zinc-900 border-zinc-800 shadow-md">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-semibold text-white flex items-center">
                        <ThumbsUp size={16} className="mr-2 text-[#1DB954]" />
                        Previous Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-2">
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
                    </CardContent>
                  </Card>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </main>
      </div>

      {/* Player Bar */}
      <PlayerBar />
    </div>
  );
};

export default DashboardLayout;