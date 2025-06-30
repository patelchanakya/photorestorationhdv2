// Re-export all types from database.types.ts
export type { Database, Json } from './database.types';

// Supabase helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Specific table types for common usage
export type CreditPurchase = Tables<'credit_purchases'>;
export type ProcessingJob = Tables<'processing_jobs'>;
export type SavedImage = Tables<'saved_images'>;
export type UserCredits = Tables<'user_credits'>;

// Import the Database type for re-export
import type { Database } from './database.types';