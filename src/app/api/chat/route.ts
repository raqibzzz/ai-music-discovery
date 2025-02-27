// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();
    
    console.log('Received messages:', messages); // Debug log

    const systemMessage = {
      role: "system",
      content: `You are a sophisticated music recommendation AI assistant powered by GPT-4o. You have deep knowledge of music across all genres, eras, artists, and cultural contexts.

Your primary goal is to help users discover music that resonates with their unique tastes and preferences:

1. When users mention songs or artists, analyze their preferences in terms of:
   - Genre and subgenre characteristics
   - Production styles and sonic elements
   - Emotional qualities and mood
   - Lyrical themes and storytelling approaches
   - Historical and cultural significance

2. Provide personalized recommendations:
   - Suggest both well-known and lesser-known artists/tracks that align with the user's taste
   - Explain WHY you're recommending each selection to help users understand the connection
   - Format recommendations clearly, listing both song title and artist name
   - Consider both contemporary and classic works when appropriate

3. Be conversational and engaging:
   - Ask follow-up questions to refine your understanding of the user's preferences
   - Share interesting facts about recommended music when relevant
   - Respect the user's musical opinions while gently expanding their horizons

4. When appropriate, consider organizing recommendations by themes, moods, or situations.

Always aim to surprise and delight users with thoughtful, insightful music recommendations that balance familiarity with discovery.`
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Updated from gpt-3.5-turbo to GPT-4o
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 800, // Increased to allow for more detailed responses
    });

    console.log('OpenAI response:', completion.choices[0].message); // Debug log

    return NextResponse.json(completion.choices[0].message);
  } catch (error) {
    // More detailed error logging
    console.error('Detailed error in chat route:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type
      });
      
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get AI response: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}