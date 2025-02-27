'use client';

import React from 'react';
import { ExternalLink, Music, RefreshCw } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface SpotifySetupGuideProps {
  error?: string;
  onRetry?: () => void;
}

const SpotifySetupGuide: React.FC<SpotifySetupGuideProps> = ({ error, onRetry }) => {
  const handleSignIn = () => {
    signIn('spotify', { callbackUrl: window.location.href });
  };

  const handleOpenSpotify = () => {
    window.open('https://open.spotify.com', '_blank');
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-xl max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Music className="text-green-500 mr-3" size={28} />
        <h2 className="text-white text-xl font-semibold">Spotify Playback Setup</h2>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <p className="text-gray-300">
          To use the music player, please follow these steps:
        </p>
        
        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
          <li>
            <strong>Make sure you have Spotify Premium</strong> - The playback control features require a Premium account.
          </li>
          <li>
            <strong>Open Spotify on a device</strong> - Playback control requires an active Spotify session on any device 
            (desktop app, web player, mobile app, etc.).
          </li>
          <li>
            <strong>Allow the required permissions</strong> - When signing in, make sure you accept all the requested permissions.
          </li>
          <li>
            <strong>Refresh this page</strong> - After setting up Spotify, refresh this page to reconnect.
          </li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSignIn}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors flex-1"
        >
          <Music size={20} />
          <span>Connect with Spotify</span>
        </button>
        
        <button
          onClick={handleOpenSpotify}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <ExternalLink size={20} />
          <span>Open Spotify</span>
        </button>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <RefreshCw size={20} />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SpotifySetupGuide; 