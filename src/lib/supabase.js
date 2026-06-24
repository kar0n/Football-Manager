import { createClient } from '@supabase/supabase-js';

// Hardcoding the public anon keys since this is deployed to Vercel without env vars
const supabaseUrl = 'https://yzxuybthyvqyqfcsnjif.supabase.co';
const supabaseAnonKey = 'sb_publishable_SEGKG741prshjZK_RMnEYw_3mDm_17E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
