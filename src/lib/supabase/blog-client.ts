import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { BLOG_SUPABASE_URL, BLOG_SUPABASE_ANON_KEY } from '@/lib/shared/env';

export const blogSupabase = createClient<Database>(BLOG_SUPABASE_URL, BLOG_SUPABASE_ANON_KEY);
