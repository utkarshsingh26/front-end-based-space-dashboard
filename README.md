# Space Dashboard with Vector Search

A dashboard for visualizing space-related events on a map with semantic search capabilities using LLM embeddings.

## Features

- Interactive map visualization of space-related events
- Semantic search using LLM embeddings via Chroma DB
- Related keywords suggestions using OpenAI
- Date range filtering
- Fallback to traditional search when vector search is unavailable

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- OpenAI API key

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd front-end-based-space-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already present)
   - Add your OpenAI API key to the `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

4. Start the Chroma DB vector database:
   ```
   docker-compose up -d
   ```

5. Start the backend server:
   ```
   npm run server
   ```

6. In a new terminal, start the frontend development server:
   ```
   npm run dev
   ```

7. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Usage

1. Enter a keyword related to space exploration (e.g., "Elon Musk", "SpaceX", "Mars mission")
2. Optionally select a date range
3. Click "Search" to find related events
4. Explore the map to see where these events occurred
5. Click on related keywords to discover more events

## Architecture

- **Frontend**: React with Material-UI components
- **Map**: Leaflet.js for interactive mapping
- **Vector Database**: Chroma DB for semantic search
- **Embeddings**: OpenAI's text-embedding-ada-002 model
- **Backend**: Express.js server

## Development

- Frontend code is in the `src` directory
- Backend server code is in `src/services/server.js`
- API service for the frontend is in `src/services/api.js`

## License

MIT
