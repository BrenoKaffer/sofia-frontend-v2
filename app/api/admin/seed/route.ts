import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { insightsData } from '@/lib/insights-data';

// Helper to generate a slug from title
const toSlug = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

// Create a Supabase client with the Service Role Key to bypass RLS
// Note: We use a lazy initialization or check to prevent build errors if env var is missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    // Security check: Only allow if ENABLE_SEED is explicitly set to "true"
    if (process.env.ENABLE_SEED !== 'true') {
      return NextResponse.json({ error: 'Seeding is disabled in this environment' }, { status: 403 });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Starting database seed...');

    // 1. Clear existing data (optional, but good for idempotency during dev)
    // Be careful with this in production!
    const { error: deleteLessonsError } = await supabaseAdmin.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteLessonsError) console.warn('Error clearing lessons:', deleteLessonsError);
    
    const { error: deleteModulesError } = await supabaseAdmin.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteModulesError) console.warn('Error clearing modules:', deleteModulesError);

    let moduleCounter = 1;

    for (const moduleData of insightsData) {
      const moduleSlug = toSlug(moduleData.title);
      
      // Insert Module
      const { data: module, error: moduleError } = await supabaseAdmin
        .from('modules')
        .insert({
          title: moduleData.title,
          slug: moduleSlug,
          order: moduleCounter++
        })
        .select()
        .single();

      if (moduleError) {
        console.error(`Error inserting module ${moduleData.title}:`, moduleError);
        continue;
      }

      console.log(`Inserted module: ${module.title}`);

      // Insert Lessons for this Module
      let lessonCounter = 1;
      const lessonsToInsert = moduleData.lessons.map(lesson => {
        // Parse duration to seconds (rough estimate)
        let durationSeconds = 300; // Default 5 min
        if (lesson.duration.includes('min')) {
          durationSeconds = parseInt(lesson.duration) * 60;
        }

        return {
          module_id: module.id,
          title: lesson.title,
          subtitle: lesson.subtitle,
          slug: lesson.id, // Using the ID from the file as slug for consistency
          duration_seconds: durationSeconds,
          category: lesson.category,
          badge: lesson.badge,
          thumbnail_url: lesson.thumbnailUrl,
          video_url: lesson.videoUrl,
          mux_playback_id: lesson.muxPlaybackId || (lesson.videoUrl?.includes('mux.com') ? 'extracted-id' : null), // simplified logic
          is_free: !lesson.locked, // In the file 'locked' means "requires pro", so is_free is !locked
          order: lessonCounter++
        };
      });

      const { error: lessonsError } = await supabaseAdmin
        .from('lessons')
        .insert(lessonsToInsert);

      if (lessonsError) {
        console.error(`Error inserting lessons for module ${module.title}:`, lessonsError);
      } else {
        console.log(`Inserted ${lessonsToInsert.length} lessons for module ${module.title}`);
      }
    }

    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
