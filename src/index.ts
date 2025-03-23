#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Talent } from "./types.js";
import * as supabaseService from "./supabase.js";

// Logger function for production
const logger = {
  info: (message: string, ...args: any[]) => {
    console.error(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Sample talent data (used as fallback if Supabase isn't configured)
const sampleTalents: Talent[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    description: "Profile for Maya Chen",
    type: "designer",
    aesthetic: {
      description: "Vibrant and playful with high-energy colors, bold contrasts, and dynamic animations for an engaging digital experience.",
      keywords: ["vibrant", "playful", "energetic", "bold", "expressive", "engaging"]
    },
    "created_at": "2025-03-21T21:49:43.000Z",
    "updated_at": "2025-03-21T21:49:43.000Z"
  },
  {
    id: "olivia-gray",
    name: "Olivia Gray",
    description: "Profile for Olivia Gray",
    type: "designer",
    aesthetic: {
      description: "Modern and refined with subtle contrasts, cooler tones, and slightly faster animations for a contemporary digital experience.",
      keywords: ["modern", "refined", "cool", "subtle", "sophisticated", "contemporary"]
    },
    "created_at": "2025-03-21T21:49:43.000Z",
    "updated_at": "2025-03-21T21:49:43.000Z"
  }
];

// Flag to track if we're using Supabase or sample data
let usingSupabase = false;

// Initialize Supabase if environment variables are set
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabaseService.initSupabase();
    usingSupabase = true;
    logger.info("Supabase client initialized successfully");
  } else {
    logger.info("Supabase environment variables not set, using sample data");
  }
} catch (error) {
  logger.error("Failed to initialize Supabase:", error);
  logger.info("Falling back to sample data");
}

// Helper function to get talents (either from Supabase or sample data)
async function getTalents(): Promise<Talent[]> {
  if (usingSupabase) {
    try {
      return await supabaseService.fetchAllTalents();
    } catch (error) {
      logger.error("Error fetching talents from Supabase:", error);
      return sampleTalents;
    }
  }
  return sampleTalents;
}

// Helper function to get a talent by ID
async function getTalentById(id: string): Promise<Talent | null> {
  if (usingSupabase) {
    try {
      return await supabaseService.fetchTalentById(id);
    } catch (error) {
      logger.error(`Error fetching talent with ID ${id} from Supabase:`, error);
      return sampleTalents.find(t => t.id === id) || null;
    }
  }
  return sampleTalents.find(t => t.id === id) || null;
}

// Helper function to query talents
async function queryTalentsWithCriteria(criteria: Record<string, any> = {}): Promise<Talent[]> {
  if (usingSupabase) {
    try {
      return await supabaseService.queryTalents(criteria);
    } catch (error) {
      logger.error("Error querying talents from Supabase:", error);
      
      // Fallback to filtering sample data
      return sampleTalents.filter(talent => {
        return Object.entries(criteria).every(([key, value]) => {
          if (key === 'keywords' && talent.aesthetic?.keywords) {
            const searchValue = typeof value === 'string' ? value : String(value);
            return talent.aesthetic.keywords.some(keyword => 
              keyword.toLowerCase().includes(searchValue.toLowerCase())
            );
          }
          
          return (
            talent[key] === value || 
            JSON.stringify(talent[key]).toLowerCase().includes(String(value).toLowerCase())
          );
        });
      });
    }
  }
  
  // Filter sample data
  return sampleTalents.filter(talent => {
    return Object.entries(criteria).every(([key, value]) => {
      if (key === 'keywords' && talent.aesthetic?.keywords) {
        const searchValue = typeof value === 'string' ? value : String(value);
        return talent.aesthetic.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      return (
        talent[key] === value || 
        JSON.stringify(talent[key]).toLowerCase().includes(String(value).toLowerCase())
      );
    });
  });
}

// Create an MCP server
const server = new McpServer({
  name: "Popmelt Talent Profile",
  version: "1.0.0",
});

// Add a resource to list all talents
server.resource(
  "talents_list",
  new ResourceTemplate("talents://list", { list: undefined }),
  async () => {
    try {
      logger.debug("Listing all talents");
      const talents = await getTalents();
      
      return {
        contents: [
          {
            uri: "talents://list",
            text: JSON.stringify(talents.map(t => ({
              id: t.id,
              name: t.name,
              type: t.type
            })))
          }
        ]
      };
    } catch (error) {
      logger.error("Error listing talents:", error);
      return {
        contents: [],
        isError: true
      };
    }
  }
);

// Add a resource to get a specific talent by ID
server.resource(
  "talent",
  new ResourceTemplate("talents://{id}", { list: undefined }),
  async (uri, params) => {
    try {
      const id = String(params.id);
      logger.debug(`Fetching talent: ${id}`);
      const talent = await getTalentById(id);
      
      if (!talent) {
        return {
          contents: [],
          isError: true
        };
      }
      
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(talent),
          },
        ],
      };
    } catch (error) {
      logger.error(`Error fetching talent ${params.id}:`, error);
      return {
        contents: [],
        isError: true
      };
    }
  }
);

// Add a tool to query talents based on criteria
server.tool(
  "mcp_popmelt_query_talents", 
  {
    criteria: z.record(z.any()).optional()
  },
  async (params) => {
    try {
      logger.debug("Querying talents with criteria:", params);
      
      const talents = await queryTalentsWithCriteria(params.criteria || {});
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(talents, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error("Error querying talents:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Failed to query talents" })
          }
        ],
        isError: true
      };
    }
  }
);

// Add a tool to generate CSS based on talent profile
server.tool(
  "mcp_popmelt_generate_css",
  {
    talent_id: z.string(),
    component: z.enum(["button", "card", "input", "navbar", "modal", "table"]),
    state: z.enum(["default", "hover", "active", "disabled", "focus"]).optional().default("default"),
    custom_properties: z.record(z.union([z.string(), z.number()])).optional()
  },
  async (params) => {
    try {
      const { talent_id, component, state, custom_properties } = params;
      logger.debug(`Generating CSS for ${component} (${state}) using talent ${talent_id}`);
      
      // Find the talent
      const talent = await getTalentById(talent_id);
      if (!talent) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Talent with ID "${talent_id}" not found` })
            }
          ],
          isError: true
        };
      }

      // Generate CSS based on component type and talent's design system
      let css = "";
      switch (component) {
        case "button":
          css = generateButtonCSS(talent, state, custom_properties);
          break;
        case "card":
          css = generateCardCSS(talent, state, custom_properties);
          break;
        case "input":
          css = generateInputCSS(talent, state, custom_properties);
          break;
        default:
          css = `/* CSS for ${component} component */`;
      }

      return {
        content: [
          {
            type: "text",
            text: css
          }
        ]
      };
    } catch (error) {
      logger.error("Error generating CSS:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "Failed to generate CSS" })
          }
        ],
        isError: true
      };
    }
  }
);

// Helper functions for CSS generation
function generateButtonCSS(talent: Talent, state: string, custom_properties?: Record<string, string | number>) {
  // Default button CSS
  const buttonCSS = `.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  border: none;
  outline: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background-color: #4a90e2;
  color: white;
  transition: all 0.2s ease;
}

.button:hover {
  background-color: #357ab8;
}

.button:active {
  transform: translateY(1px);
}

.button:focus {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}`;

  return buttonCSS;
}

function generateCardCSS(talent: Talent, state: string, custom_properties?: Record<string, string | number>) {
  return `.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}`;
}

function generateInputCSS(talent: Talent, state: string, custom_properties?: Record<string, string | number>) {
  return `.input {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  transition: all 0.2s ease;
}

.input:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
  outline: none;
}

.input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}`;
}

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

logger.info("Starting Popmelt Talent Profile MCP Server...");
await server.connect(transport);
logger.info("MCP Server stopped");
