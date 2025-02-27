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
      content: `You are a music recommendation AI assistant. You help users discover new music based on their tastes. 
      When users mention songs or artists, try to understand their music preferences and suggest similar artists or songs. 
      Keep responses conversational but focused on music discovery. 
      When suggesting songs, format them clearly with artist names.
      Focus on understanding the user's taste in terms of genres, moods, and musical elements.`
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more widely available model
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500,
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