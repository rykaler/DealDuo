import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mfhupdnyqlpqnbqljija.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1maHVwZG55cWxwcW5icWxqaWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzYxMDgsImV4cCI6MjA5MzE1MjEwOH0.-taNnf-hPC-yHO9NWaTO-D9BWdKZRwuN2GhjA27rud4";

export const supabase = createClient(supabaseUrl, supabaseKey);