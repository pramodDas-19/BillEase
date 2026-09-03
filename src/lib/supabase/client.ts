import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://butxutqhbhscbihunnwr.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_-pV2SiWE3RXBHyN63admfg_z8S0yx9c";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
