/**
 * Talent profile interface
 */
export interface Talent {
  id: string;
  name: string;
  description: string;
  type: string;
  aesthetic: {
    description: string;
    keywords: string[];
  };
  title?: string | null;
  summary?: string | null;
  photo?: string | null;
  "design-system"?: Record<string, any>;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow for additional properties
} 