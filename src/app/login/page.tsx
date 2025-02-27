'use client'

import { signIn } from "next-auth/react"
import { Music } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <Card className="w-[400px] shadow-lg bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-col items-center space-y-1 pt-8">
          <div className="rounded-full">
            <Music className="h-10 w-10 text-[#1DB954]" />
          </div>
          <CardTitle className="text-xl font-bold mt-4 text-white">
            AI Music Discovery
          </CardTitle>
          <CardDescription className="text-sm text-zinc-400 text-center max-w-[280px]">
            Sign in with your Spotify account to get personalized music recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <Button 
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-6 rounded-full transition-all"
            onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
          >
            Continue with Spotify
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}