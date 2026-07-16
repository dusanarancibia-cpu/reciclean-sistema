import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://eknmtsrtfkzroxnovfqn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbm10c3J0Zmt6cm94bm92ZnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY2ODgsImV4cCI6MjA5MDk4MjY4OH0.8Y4N0lw3DFN3Y8-R6ID7t_LAfgHWDM5N-oa4Ji9bncg';

const runtimeUrl = typeof window !== 'undefined' ? window.SUPABASE_URL : undefined;
const runtimeAnonKey = typeof window !== 'undefined' ? window.SUPABASE_ANON_KEY : undefined;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || runtimeUrl || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeAnonKey || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
