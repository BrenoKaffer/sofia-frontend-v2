import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, watchedSeconds, completed } = body;

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: session.user.id,
        lesson_id: lessonId,
        watched_seconds: watchedSeconds || 0,
        completed: completed || false,
        last_watched_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, lesson_id'
      });

    if (error) {
      console.error('Error updating progress:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
