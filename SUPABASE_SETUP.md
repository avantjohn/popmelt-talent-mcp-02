# Supabase Setup Guide for Popmelt Talent MCP

This guide will help you set up a Supabase backend for the Popmelt Talent MCP server.

## 1. Create a Supabase Project

1. Go to [https://supabase.com/](https://supabase.com/) and sign up for an account if you don't have one.
2. Create a new project by clicking "New Project".
3. Choose a name (e.g., `popmelt-talent-mcp`), set a strong database password, and select the region closest to you.
4. Click "Create new project".
5. Wait for your database to be provisioned (usually takes a few minutes).

## 2. Set Up Database Schema

Once your project is ready, you'll need to set up the database schema.

### Create the Talents Table

1. Go to the SQL Editor in your Supabase dashboard.
2. Create a new query and paste the following SQL:

```sql
-- Create the talents table
CREATE TABLE talents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  photo TEXT,
  aesthetic JSONB NOT NULL,
  design_system JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a trigger to update the updated_at field
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON talents
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create an index on the type field for faster filtering
CREATE INDEX idx_talents_type ON talents(type);

-- Enable full-text search for the aesthetic JSON field
CREATE INDEX idx_talents_aesthetic ON talents USING GIN (aesthetic);
```

3. Click "Run" to execute the SQL and create the table.

## 3. Set Up Row Level Security (RLS)

For production, you should set up Row Level Security to control access to your data:

1. Go to the "Authentication" > "Policies" section.
2. Click on the "talents" table.
3. Enable RLS by turning on the toggle.
4. Add a policy for anonymous read access (if you want users to be able to access talent profiles without authentication):

   - Policy name: `Allow anonymous read access`
   - Policy definition: 
   ```sql
   (SELECT value FROM public.configs WHERE name = 'allow_anonymous_reads')::boolean
   ```
   - Target roles: `INSERT`, `SELECT`

   This relies on a config table that we'll create next.

## 4. Create a Config Table for App Settings

```sql
-- Create a configs table for app settings
CREATE TABLE configs (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default config for anonymous access
INSERT INTO configs (name, value, description)
VALUES 
  ('allow_anonymous_reads', 'true', 'Whether to allow anonymous read access to talent profiles');
```

## 5. Insert Sample Data

```sql
-- Insert sample talent data
INSERT INTO talents (id, name, description, type, aesthetic, design_system)
VALUES
  (
    'maya-chen',
    'Maya Chen',
    'Profile for Maya Chen',
    'designer',
    '{
      "description": "Vibrant and playful with high-energy colors, bold contrasts, and dynamic animations for an engaging digital experience.",
      "keywords": ["vibrant", "playful", "energetic", "bold", "expressive", "engaging"]
    }',
    '{
      "meta": {
        "schema-version": "1.0.0",
        "implementation": "css",
        "description": "Implementation that transforms design tokens into CSS variables and Tailwind extensions with oklch color space and modern typography features",
        "frameworks": ["tailwind", "css-variables"],
        "preferred-prefix": "mc"
      },
      "colors": {
        "core": {
          "base": "oklch(65% 0.18 30)"
        }
      }
    }'
  ),
  (
    'olivia-gray',
    'Olivia Gray',
    'Profile for Olivia Gray',
    'designer',
    '{
      "description": "Modern and refined with subtle contrasts, cooler tones, and slightly faster animations for a contemporary digital experience.",
      "keywords": ["modern", "refined", "cool", "subtle", "sophisticated", "contemporary"]
    }',
    '{
      "meta": {
        "schema-version": "1.0.0",
        "implementation": "css",
        "description": "Implementation that transforms design tokens into CSS variables and Tailwind extensions with oklch color space and modern typography features",
        "frameworks": ["tailwind", "css-variables"],
        "preferred-prefix": "og"
      },
      "colors": {
        "core": {
          "base": "oklch(45% 0.09 270)"
        }
      }
    }'
  );
```

## 6. Get Your API Keys

1. Go to "Project Settings" > "API"
2. Copy the "Project URL" (this will be your `SUPABASE_URL`)
3. Copy the "anon public" key (this will be your `SUPABASE_KEY`)

## 7. Configure Environment Variables

When setting up your MCP server, provide these environment variables:

```bash
SUPABASE_URL=<your-project-url>
SUPABASE_KEY=<your-anon-public-key>
```

You can set these:
- During development: In a `.env` file (make sure to add it to `.gitignore`)
- In production: In your hosting environment's configuration

## 8. Additional Security Considerations

For a production environment, consider:

1. Using a service key for server-side operations that require more privileges
2. Setting up more granular RLS policies 
3. Implementing authentication if needed for creating/updating talent profiles
4. Setting up webhooks for real-time updates to MCP when data changes

## Testing Your Connection

You can test your connection by running the MCP server with the environment variables set:

```bash
SUPABASE_URL=<your-project-url> SUPABASE_KEY=<your-anon-key> npm start
```

The server will log whether it successfully connected to Supabase or if it's falling back to sample data. 