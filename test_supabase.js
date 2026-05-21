import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhzoelroypkezhzhdsmd.supabase.co';
const supabaseAnonKey = 'sb_publishable_dgOrryJSc-3HFddklX6rzQ_kI4QwnRa';

console.log("Creating client...");
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Calling getSession...");
supabase.auth.getSession().then((res) => {
    console.log("getSession resolved:", res);
}).catch((err) => {
    console.error("getSession error:", err);
});
