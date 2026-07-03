import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://joqlxybxfivjpabvopxu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcWx4eWJ4Zml2anBhYnZvcHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzExNTEsImV4cCI6MjA4OTE0NzE1MX0.zxm1tXbZgeK_kf-A796ysDFREyS6thKW3DV8n-iBaNE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_triggers'); // check if helper exists, else query pg_trigger
  if (error) {
    // fallback: query using direct sql if possible (not possible with anon key directly unless custom function)
    console.log("No direct RPC, query profiles detail instead");
  }
  
  // Let's query public.profiles schema details or constraints
  const { data: profiles, error: err } = await supabase.from('profiles').select('*');
  console.log("Profiles list:", profiles);
}
main();
