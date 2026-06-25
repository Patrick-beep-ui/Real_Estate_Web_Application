const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mcgzyxrozhogzmohyfos.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3p5eHJvemhvZ3ptb2h5Zm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTI5MTEsImV4cCI6MjA5MjM2ODkxMX0.4YYMtjUoWtBpjD9nwQvxnaD5xOpEFgxkX_GT8ikhRT8'
);

const d = require('./blog-posts-seller-guides.json');
const doneSlug = 'how-to-avoid-foreclosure-options-most-homeowners-don-t-know-about';
const posts = d.filter(p => p.slug !== doneSlug);

async function main() {
  for (const p of posts) {
    const { id, ai_generated, created_at, updated_at, author_id, location_id, tags, ...insertData } = p;
    insertData.status = 'draft';
    insertData.ai_generated = false;

    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(insertData, { onConflict: 'slug', ignoreDuplicates: false })
      .select('id, slug, title, status');

    if (error) {
      console.error(`ERROR [${p.slug}]:`, error.message);
    } else {
      console.log(`OK [${p.slug}]: ${data?.[0]?.title} — ${data?.[0]?.status}`);
    }
  }
}

main().catch(console.error);
