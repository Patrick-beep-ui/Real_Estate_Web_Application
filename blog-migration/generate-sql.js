const fs = require('fs');
const path = require('path');
const d = require('./blog-posts-seller-guides.json');
const doneSlug = 'how-to-avoid-foreclosure-options-most-homeowners-don-t-know-about';

function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  let s = String(val);
  s = s.replace(/'/g, "''");
  return "'" + s + "'";
}

const posts = d.filter(p => p.slug !== doneSlug);

for (const p of posts) {
  const sql = `INSERT INTO blog_posts (slug, title, meta_description, excerpt, content, featured_image_url, category, seo_title, canonical_url, og_image_url, schema_type, status, ai_generated, published_at, created_at, updated_at)
VALUES (
  ${esc(p.slug)},
  ${esc(p.title)},
  ${esc(p.meta_description)},
  ${esc(p.excerpt)},
  ${esc(p.content)},
  ${esc(p.featured_image_url)},
  ${esc(p.category)},
  ${esc(p.seo_title)},
  NULL,
  ${esc(p.og_image_url)},
  ${esc(p.schema_type)},
  'draft',
  false,
  ${esc(p.published_at)},
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  excerpt = EXCLUDED.excerpt,
  meta_description = EXCLUDED.meta_description,
  featured_image_url = EXCLUDED.featured_image_url,
  category = EXCLUDED.category,
  seo_title = EXCLUDED.seo_title,
  og_image_url = EXCLUDED.og_image_url,
  schema_type = EXCLUDED.schema_type,
  ai_generated = false,
  updated_at = NOW();`;

  const filePath = path.join(__dirname, 'sql', p.slug + '.sql');
  fs.mkdirSync(path.join(__dirname, 'sql'), { recursive: true });
  fs.writeFileSync(filePath, sql);
  console.log('Wrote: ' + filePath);
}

console.log('Done: ' + posts.length + ' SQL files generated');
