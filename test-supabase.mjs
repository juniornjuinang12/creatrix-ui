import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhzoelroypkezhzhdsmd.supabase.co';
const supabaseAnonKey = 'sb_publishable_dgOrryJSc-3HFddklX6rzQ_kI4QwnRa';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing ai_chats...");
  const { data: aiData, error: aiError } = await supabase.from('ai_chats').select('*').limit(1);
  console.log("AI Chats Error:", aiError);
  console.log("AI Chats Data:", aiData);

  console.log("\nTesting direct_messages...");
  const { data: dmData, error: dmError } = await supabase.from('direct_messages').select('*').limit(1);
  console.log("DM Error:", dmError);
  console.log("DM Data:", dmData);

  // Let's try inserting a fake message to see if it's an RLS issue.
  // Wait, without a real JWT (user session), we can't test RLS properly for inserts.
  // But we can test if the columns exist at least.
}
test();
