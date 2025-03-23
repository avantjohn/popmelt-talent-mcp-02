#!/usr/bin/env node

// Simple script to test if Supabase environment variables are loaded correctly

console.log("Testing Supabase environment variables:");
console.log("-".repeat(40));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (supabaseUrl) {
  console.log("✅ SUPABASE_URL is set:", maskUrl(supabaseUrl));
} else {
  console.log("❌ SUPABASE_URL is not set");
}

if (supabaseKey) {
  console.log("✅ SUPABASE_KEY is set:", maskKey(supabaseKey));
} else {
  console.log("❌ SUPABASE_KEY is not set");
}

console.log("-".repeat(40));

// Helper function to mask the URL for security
function maskUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host.split('.')[0]}.***.supabase.co`;
  } catch (e) {
    return "Invalid URL format";
  }
}

// Helper function to mask the key for security
function maskKey(key) {
  if (typeof key !== 'string') return "Invalid key format";
  if (key.length < 10) return "***";
  return key.substring(0, 3) + "..." + key.substring(key.length - 3);
} 