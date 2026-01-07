import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Module, Lesson, UserProgress } from '@/types/lessons';
import { insightsData } from '@/lib/insights-data';
import { checkUserFullAccess } from '@/lib/user-status';

// Helper to generate a slug from title
const toSlug = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

// Mapping fallback data for development/empty DB states
const fallbackModules: Module[] = insightsData.map((mod, index) => ({
  id: `mod-${index}`,
  title: mod.title,
  slug: toSlug(mod.title),
  order: index + 1,
  lessons: mod.lessons.map((less, lIndex) => ({
    id: less.id,
    module_id: `mod-${index}`,
    title: less.title,
    subtitle: less.subtitle || null,
    slug: less.id, // using ID as slug for fallback consistency with existing links
    duration: less.duration,
    duration_seconds: parseInt(less.duration) * 60 || 300,
    locked: less.locked,
    category: less.category,
    badge: less.badge,
    thumbnail_url: less.thumbnailUrl,
    video_url: less.videoUrl,
    mux_playback_id: less.muxPlaybackId,
    is_free: !less.locked,
    order: lIndex + 1
  }))
}));

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check user_profiles first (cache/summary)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('status, plan, role')
      .eq('user_id', userId)
      .single();
      
    if (profile && checkUserFullAccess(profile)) return true;
    
    // Check subscriptions table (source of truth)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();
      
    return !!sub;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

export async function getModulesWithLessons(userId?: string): Promise<Module[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check subscription if userId provided
    const isPro = userId ? await hasActiveSubscription(userId) : false;

    // 2. Fetch Modules with Lessons
    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        *,
        lessons (*)
      `)
      .order('order', { ascending: true });

    if (error) {
      console.warn('Supabase error fetching modules:', error.message);
      // Fallback with locked logic based on isPro (mocked)
      // NOTE: This fallback should be removed in production once data is seeded
      if (process.env.NODE_ENV === 'development') {
         return fallbackModules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => ({
            ...l,
            locked: !l.is_free && !isPro
            }))
        }));
      }
      return [];
    }

    if (!modules || modules.length === 0) {
      console.log('No modules found in DB.');
      if (process.env.NODE_ENV === 'development') {
         console.log('Using fallback data (DEV ONLY).');
         return fallbackModules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => ({
            ...l,
            locked: !l.is_free && !isPro
            }))
        }));
      }
      return [];
    }

    // 3. Process and Sort Data
    const processedModules: Module[] = modules.map((mod: any) => ({
      id: mod.id,
      title: mod.title,
      slug: mod.slug,
      order: mod.order,
      lessons: (mod.lessons || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((l: any) => {
          // Calculate duration string if not present
          const durationStr = l.duration_seconds 
            ? `${Math.ceil(l.duration_seconds / 60)} min` 
            : '5 min';

          return {
            id: l.id,
            module_id: l.module_id,
            title: l.title,
            subtitle: l.subtitle,
            slug: l.slug,
            duration: durationStr,
            duration_seconds: l.duration_seconds,
            // Logic: locked if not free AND user is not pro
            locked: !l.is_free && !isPro, 
            category: l.category || 'Geral',
            badge: l.badge,
            thumbnail_url: l.thumbnail_url,
            video_url: l.video_url,
            mux_playback_id: l.mux_playback_id,
            is_free: l.is_free,
            order: l.order
          };
        })
    }));

    return processedModules;

  } catch (err) {
    console.error('Service error in getModulesWithLessons:', err);
    return fallbackModules;
  }
}

export async function getLessonBySlug(slug: string, userId?: string): Promise<Lesson | null> {
    const supabase = await createSupabaseServerClient();
    
    // Check subscription if userId provided
    const isPro = userId ? await hasActiveSubscription(userId) : false;

    const { data: lesson, error } = await supabase
        .from('lessons')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`) // Support both slug and id lookup
        .single();

    if (error || !lesson) {
        // Search in fallback
        for (const mod of fallbackModules) {
            const found = mod.lessons.find(l => l.slug === slug || l.id === slug);
            if (found) {
                return {
                    ...found,
                    locked: !found.is_free && !isPro
                };
            }
        }
        return null;
    }

    return {
        id: lesson.id,
        module_id: lesson.module_id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        slug: lesson.slug,
        duration: lesson.duration_seconds ? `${Math.ceil(lesson.duration_seconds / 60)} min` : '5 min',
        duration_seconds: lesson.duration_seconds,
        locked: !lesson.is_free && !isPro,
        category: lesson.category || 'Aula',
        badge: lesson.badge,
        thumbnail_url: lesson.thumbnail_url,
        video_url: lesson.video_url,
        mux_playback_id: lesson.mux_playback_id,
        is_free: lesson.is_free,
        order: lesson.order
    };
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // Quietly fail for progress (non-critical)
      return [];
    }

    return progress || [];
  } catch (err) {
    console.error('Service error in getUserProgress:', err);
    return [];
  }
}

export async function getContinueWatching(userId: string): Promise<(Lesson & { progress: number })[]> {
    const progress = await getUserProgress(userId);
    if (!progress.length) return [];

    // Filter for in-progress items (e.g. not completed, or recently watched)
    // For now, let's take the last modified ones that are not completed
    const inProgressItems = progress
        .filter(p => !p.completed && p.watched_seconds > 0)
        .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
        .slice(0, 5); // Take top 5

    const lessons: (Lesson & { progress: number })[] = [];

    for (const item of inProgressItems) {
        const supabase = await createSupabaseServerClient();
        const { data: lesson } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', item.lesson_id)
            .single();

        if (lesson) {
            const durationSec = lesson.duration_seconds || 300;
            const pct = Math.min(100, Math.round((item.watched_seconds / durationSec) * 100));
            
            lessons.push({
                id: lesson.id,
                module_id: lesson.module_id,
                title: lesson.title,
                subtitle: lesson.subtitle,
                slug: lesson.slug,
                duration: `Restam ${Math.ceil((durationSec - item.watched_seconds) / 60)} min`,
                duration_seconds: lesson.duration_seconds,
                locked: false, // Continue watching usually implies they have access, but strictly we should check. 
                               // For UI purposes, if they started it, they probably have access.
                category: lesson.category || 'Continuar',
                badge: 'Em Progresso',
                thumbnail_url: lesson.thumbnail_url,
                video_url: lesson.video_url,
                mux_playback_id: lesson.mux_playback_id,
                is_free: lesson.is_free,
                order: lesson.order,
                progress: pct
            });
        } else {
             // Try fallback lookup
             for (const mod of fallbackModules) {
                const found = mod.lessons.find(l => l.id === item.lesson_id);
                if (found) {
                     const durationSec = found.duration_seconds || 300;
                     const pct = Math.min(100, Math.round((item.watched_seconds / durationSec) * 100));
                     lessons.push({
                         ...found,
                         duration: `Restam ${Math.ceil((durationSec - item.watched_seconds) / 60)} min`,
                         badge: 'Em Progresso',
                         progress: pct
                     });
                     break;
                }
             }
        }
    }

    return lessons;
}
