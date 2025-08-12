import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db.types';

export function supabaseBrowser() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    
    if (!anonKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    }
    
    // Debug log removed for production
    
    return createBrowserClient<Database>(url, anonKey);
}