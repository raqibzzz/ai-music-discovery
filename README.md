# AI Music Discovery

An AI-powered music discovery application that uses AI to help users discover new music based on their preferences. This application integrates with Spotify to provide personalized music recommendations through natural language conversations.

![Music Discovery App](https://placeholder-for-screenshot.png)

## Features

- AI-powered music assistant for natural language conversations about music
- Personalized music recommendations based on your queries and preferences
- Spotify integration for searching and playing tracks
- Recently played tracks history
- Player controls with playback functionality
- Responsive and modern UI inspired by Spotify's design language

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.x or newer)
- [npm](https://www.npmjs.com/) (v6.x or newer)
- A Spotify Developer account and registered application for API credentials

## Spotify API Setup

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create An App"
4. Fill in the app name and description
5. Once created, note your `Client ID` and `Client Secret`
6. Add `http://localhost:3000/api/auth/callback/spotify` to the Redirect URIs in your app settings

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-music-discovery.git
   cd ai-music-discovery
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following environment variables:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_string
   OPENAI_API_KEY=your_openai_api_key
   ```

   Replace the placeholder values with your actual API keys and secrets.

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

3. Log in with your Spotify account when prompted

## Usage

- Start by asking the AI music assistant for recommendations
- Try queries like "Recommend songs similar to Radiohead's Creep" or "Help me discover 90s hip hop artists"
- Click on suggested tracks to play them
- Use the player controls at the bottom to manage playback
- View your recently played tracks on the right sidebar

## Available Scripts

- `npm run dev` - Run the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
/
├── src/
│   ├── app/               # Next.js app directory with pages and components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions and Spotify API client
├── public/                # Static assets
├── .env.local.example     # Example environment variables
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies and scripts
├── LICENSE                # MIT License
└── README.md              # Project documentation
```

## Technologies Used

- [Next.js](https://nextjs.org/) (v15.x) - React framework
- [React](https://react.dev/) (v19.x) - UI library
- [NextAuth.js](https://next-auth.js.org/) (v4.x) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels) - Resizable layout panels
- [OpenAI API](https://openai.com/api/) - AI-powered conversation
- [Lucide React](https://lucide.dev/) - Icons
- [TypeScript](https://www.typescriptlang.org/) - Type checking

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

- Thanks to the Spotify API for providing music data
- OpenAI for powering the conversational AI
- All the open-source libraries and tools used in this project
