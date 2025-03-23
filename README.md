# Popmelt Talent Profile MCP Server

A Model Context Protocol (MCP) server for Popmelt Talent Profiles, designed to work with Cursor and other MCP-compatible tools.

## Features

- Query designer talent profiles
- Generate CSS based on a designer's style preferences
- Supabase integration for data storage
- Production-ready with Docker support

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- (Optional) Docker for containerized deployment
- (Optional) Supabase account for database storage

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy the example environment file and update it with your Supabase credentials:

```bash
cp .env.example .env
```

Edit the `.env` file with your Supabase URL and key. (See [Supabase Setup](SUPABASE_SETUP.md) for details on setting up your Supabase project)

3. Build the project:

```bash
npm run build
```

## Development

Run the server in development mode (auto-restart on changes):

```bash
npm run dev
```

Watch TypeScript files for changes:

```bash
npm run watch
```

## Production

### Running directly with Node.js

```bash
npm run build
npm start
```

### Using Docker

Build the Docker image:

```bash
npm run docker:build
```

Run the Docker container:

```bash
npm run docker:run
```

Or manually:

```bash
docker run -it --rm --env-file .env popmelt-talent-mcp
```

## Integrating with Cursor

This MCP server is designed to work with Cursor. To use it:

1. Run the server (via any method above)
2. In Cursor, add the MCP connection pointing to this server
3. Enable the Popmelt Talent Profile extension in Cursor

## Using the MCP API

The server provides the following tools:

### `mcp_popmelt_query_talents`

Query talent profiles based on criteria:

```json
{
  "criteria": {
    "keywords": "vibrant"
  }
}
```

### `mcp_popmelt_generate_css`

Generate CSS for a component based on a talent's design system:

```json
{
  "talent_id": "maya-chen",
  "component": "button",
  "state": "default"
}
```

## Supabase Integration

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions on setting up your Supabase project.

## License

MIT 