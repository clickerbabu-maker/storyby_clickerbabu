import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://defrfqtyrqywwpwancza.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZnJmcXR5cnF5d3dwd2FuY3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzE4MjksImV4cCI6MjEwMzkwNzgyOX0.MP2B8J8HcZU0cGSf4ZhQhIGH5IK4klPpsqzWhZbhPGw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
