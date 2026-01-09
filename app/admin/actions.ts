'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-server';
import { userIsAdmin, UserRole, UserStatus, UserPlan } from '@/lib/user-status';
import { revalidatePath } from 'next/cache';

// Initialize Supabase Admin Client (Service Role)
// We use lazy init pattern or check inside functions to avoid build-time errors
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials for admin actions');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Helper to check admin permission
async function checkAdminPermission() {
  const { user, isAuthenticated } = await auth();
  
  if (!isAuthenticated || !user) {
    throw new Error('Unauthorized');
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isRoleAdmin = profile?.role === UserRole.ADMIN || profile?.role === UserRole.SUPERADMIN;

  if (error || !profile || !isRoleAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
  
  return true;
}

// --- Modules Actions ---

export async function updateModule(id: string, data: { title?: string; order?: number; published?: boolean }) {
  await checkAdminPermission();
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('modules')
    .update(data)
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/modules');
  revalidatePath('/insights');
  return { success: true };
}

export async function createModule(data: { title: string; order: number }) {
  await checkAdminPermission();
  const supabase = getSupabaseAdmin();
  
  // Generate simple slug
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const { error } = await supabase
    .from('modules')
    .insert({
      title: data.title,
      order: data.order,
      slug,
      published: true // Default
    });
    
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/modules');
  revalidatePath('/insights');
  return { success: true };
}

export async function deleteModule(id: string) {
    await checkAdminPermission();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/modules');
    revalidatePath('/insights');
    return { success: true };
}

// --- User Actions ---

export async function getUsers(page = 1, limit = 50, search = '') {
  await checkAdminPermission();
  const supabase = getSupabaseAdmin();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return { data, count, page, limit };
}

export async function updateUser(userId: string, data: { status?: string; plan?: string; role?: string }) {
  await checkAdminPermission();
  const supabase = getSupabaseAdmin();

  // Prepare update data
  const updateData: any = { ...data };

  // Sync legacy account_status based on new fields
  // REMOVED: Legacy account_status synchronization is no longer needed.
  // The column has been removed and the logic is now fully based on UserStatus, UserPlan, and UserRole.

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
  return { success: true };
}

// --- Lessons Actions ---

export async function updateLesson(id: string, data: { 
  title?: string; 
  subtitle?: string;
  order?: number; 
  is_free?: boolean; 
  published?: boolean; 
  featured?: boolean;
  video_url?: string;
  mux_playback_id?: string;
}) {
  await checkAdminPermission();
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('lessons')
    .update(data)
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/lessons');
  revalidatePath('/insights'); // Revalidate all insights pages ideally
  return { success: true };
}

export async function createLesson(data: any) { // Type 'any' for speed, refine later
    await checkAdminPermission();
    const supabase = getSupabaseAdmin();

    // Generate slug
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { error } = await supabase
        .from('lessons')
        .insert({
            ...data,
            slug,
            duration_seconds: 0, // Default
            duration: '0 min' // Default
        });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/lessons');
    revalidatePath('/insights');
    return { success: true };
}

export async function deleteLesson(id: string) {
    await checkAdminPermission();
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/lessons');
    revalidatePath('/insights');
    return { success: true };
}
