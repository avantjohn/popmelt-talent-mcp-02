import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Talent } from './types.js';

// Environment variables for Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Initialize the Supabase client
let supabase: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key must be provided as environment variables');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

/**
 * Get Supabase client instance
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    return initSupabase();
  }
  return supabase;
}

/**
 * Fetch all talents from Supabase
 */
export async function fetchAllTalents(): Promise<Talent[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('talents')
    .select('*');
  
  if (error) {
    throw new Error(`Error fetching talents: ${error.message}`);
  }
  
  return data as Talent[];
}

/**
 * Fetch a talent by ID
 */
export async function fetchTalentById(id: string): Promise<Talent | null> {
  const client = getSupabase();
  const { data, error } = await client
    .from('talents')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Record not found
      return null;
    }
    throw new Error(`Error fetching talent with ID ${id}: ${error.message}`);
  }
  
  return data as Talent;
}

/**
 * Query talents based on criteria
 */
export async function queryTalents(criteria: Record<string, any> = {}): Promise<Talent[]> {
  const client = getSupabase();
  let query = client.from('talents').select('*');
  
  // Apply filters based on criteria
  Object.entries(criteria).forEach(([key, value]) => {
    if (key === 'keywords') {
      // Special handling for keywords (they're in a nested JSON object)
      // Convert to string to ensure compatibility
      const searchTerm = typeof value === 'string' ? value : String(value);
      
      // Use contains operator for JSONB array instead of textSearch
      query = query.contains(`aesthetic->keywords`, [searchTerm]);
    } else if (key === 'type') {
      // Exact match for type
      query = query.eq(key, value);
    } else {
      // Default to ILIKE for string fields
      query = query.ilike(key, `%${value}%`);
    }
  });
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Error querying talents: ${error.message}`);
  }
  
  return data as Talent[];
}

/**
 * Create a new talent
 */
export async function createTalent(talent: Omit<Talent, 'id' | 'created_at' | 'updated_at'>): Promise<Talent> {
  const client = getSupabase();
  const { data, error } = await client
    .from('talents')
    .insert([talent])
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error creating talent: ${error.message}`);
  }
  
  return data as Talent;
}

/**
 * Update an existing talent
 */
export async function updateTalent(id: string, updates: Partial<Talent>): Promise<Talent> {
  const client = getSupabase();
  const { data, error } = await client
    .from('talents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating talent with ID ${id}: ${error.message}`);
  }
  
  return data as Talent;
}

/**
 * Delete a talent
 */
export async function deleteTalent(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('talents')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw new Error(`Error deleting talent with ID ${id}: ${error.message}`);
  }
} 