// Client-side Supabase client
export { supabaseBrowser } from './client';

// Server-side Supabase client
export { supabaseServer } from './server';

// Note: Admin client is not re-exported here to prevent accidental client-side imports
// Import directly from './admin' only in server-side code