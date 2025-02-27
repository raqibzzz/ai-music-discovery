// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSpotify } from '../../hooks/useSpotify';
import { signOut } from 'next-auth/react';
import DashboardLayout from '../components/ui/DashboardLayout';

export default function DashboardPage() {
  const { 
    topTracks, 
    isLoading, 
    error, 
    getRecommendations, 
    searchTracks 
  } = useSpotify();
  const [recommendations, setRecommendations] = useState([]);

  const handleGetRecommendations = async (trackId: string) => {
    const newRecommendations = await getRecommendations([trackId]);
    setRecommendations(newRecommendations);
  };

  const handleSearch = async (query: string) => {
    const searchResults = await searchTracks(query);
    // Use these results in your chat interface
    console.log(searchResults);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <DashboardLayout>
      {/* You can now pass these props to your DashboardLayout */}
      {/* Add your chat interface here */}
    </DashboardLayout>
  );
}