/**
 * Admin data access uses the same browser Supabase client as the rest of the app.
 * Do not ship service-role keys to the frontend: rely on RLS policies that allow
 * authenticated admin users (role checked in policies or via JWT claims), and use
 * Edge Functions for privileged operations.
 */
import { supabase } from './supabase';

/** Back-compat alias: same singleton as `supabase` (no second GoTrue client). */
export const supabaseAdmin = supabase;
