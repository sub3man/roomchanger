import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern with lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are not configured');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
}

// Backward compatibility - export as getter
export const supabase = {
    get client() {
        return getSupabase();
    },
    // Proxy methods for common operations
    from(table: string) {
        return getSupabase().from(table);
    },
    get auth() {
        return getSupabase().auth;
    },
    get storage() {
        return getSupabase().storage;
    },
};

// Types for our database tables
export interface Profile {
    id: string;
    email: string | null;
    credits: number;
    is_pro: boolean;
    created_at: string;
}

export interface Generation {
    id: string;
    user_id: string;
    original_image_url: string;
    generated_image_url: string | null;
    prompt: string | null;
    style: string | null;
    room_type: string | null;
    status: 'processing' | 'completed' | 'failed';
    created_at: string;
}
