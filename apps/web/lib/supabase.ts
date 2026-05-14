import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser klijent koji koristi cookies (kompatibilan sa middleware-om)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
  },
});

// Tipovi za bazu podataka
export type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  service_title: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
  profile_url: string;
  hourly_rate: string;
  skills: string[];
  languages: string[];
  availability: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PitchLink = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  template: string;
  views: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
