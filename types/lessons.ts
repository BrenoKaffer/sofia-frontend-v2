export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  duration: string; // Display string e.g. "5 min"
  duration_seconds: number;
  locked: boolean;
  category: string;
  badge?: string;
  thumbnail_url?: string;
  video_url?: string;
  mux_playback_id?: string;
  is_free: boolean;
  order: number;
  published?: boolean;
  featured?: boolean;
}

export interface Module {
  id: string;
  title: string;
  slug: string;
  order: number;
  lessons: Lesson[];
  published?: boolean;
}

export interface UserProgress {
  lesson_id: string;
  user_id: string;
  completed: boolean;
  watched_seconds: number;
  last_watched_at: string;
}
