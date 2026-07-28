require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const posts = require("./blog-posts-local-insights.json");

const supabase = createClient(
  "https://mcgzyxrozhogzmohyfos.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  let inserted = 0;
  let skipped = 0;
  let updated = 0;

  for (const p of posts) {
    const { id, ai_generated, created_at, updated_at, author_id, location_id, tags, published_at, ...insertData } = p;

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("slug, status")
      .eq("slug", p.slug)
      .maybeSingle();

    if (existing) {
      if (existing.status === "published") {
        console.log(`SKIP [${p.slug}] — already published`);
        skipped++;
        continue;
      }
      console.log(`UPDATE [${p.slug}] — was draft, replacing`);
      const { error } = await supabase
        .from("blog_posts")
        .update({ ...insertData, published_at, updated_at: new Date().toISOString() })
        .eq("slug", p.slug);
      if (error) {
        console.error(`ERROR [${p.slug}]:`, error.message);
      } else {
        updated++;
      }
    } else {
      console.log(`INSERT [${p.slug}]`);
      const { error } = await supabase
        .from("blog_posts")
        .insert({ ...insertData, published_at, updated_at: new Date().toISOString() });
      if (error) {
        console.error(`ERROR [${p.slug}]:`, error.message);
      } else {
        inserted++;
      }
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}, Skipped (published): ${skipped}`);
}

main().catch(console.error);
