const fs = require('fs');
const path = require('path');
const d = require('./blog-posts-cash-offers.json');

function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  let s = String(val);
  s = s.replace(/'/g, "''");
  return "'" + s + "'";
}

for (const p of d) {
  const tags = p.tags === '[]' ? "'{}'::text[]" : esc(p.tags) + '::text[]';
  const aiGen = p.ai_generated === 'true' || p.ai_generated === true ? 'true' : 'false';

  const sql = `INSERT INTO blog_posts (slug, title, meta_description, excerpt, content, featured_image_url, category, tags, seo_title, canonical_url, og_image_url, schema_type, status, ai_generated, location_id, published_at, created_at, updated_at)
VALUES (
  ${esc(p.slug)},
  ${esc(p.title)},
  ${esc(p.meta_description)},
  ${esc(p.excerpt)},
  ${esc(p.content)},
  ${esc(p.featured_image_url)},
  ${esc(p.category)},
  ${tags},
  ${esc(p.seo_title)},
  NULL,
  ${esc(p.og_image_url)},
  ${esc(p.schema_type)},
  ${esc(p.status)},
  ${aiGen},
  NULL,
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
  tags = EXCLUDED.tags,
  seo_title = EXCLUDED.seo_title,
  og_image_url = EXCLUDED.og_image_url,
  schema_type = EXCLUDED.schema_type,
  status = EXCLUDED.status,
  ai_generated = EXCLUDED.ai_generated,
  location_id = EXCLUDED.location_id,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();`;

  const filePath = path.join(__dirname, 'sql', p.slug + '.sql');
  fs.mkdirSync(path.join(__dirname, 'sql'), { recursive: true });
  fs.writeFileSync(filePath, sql);
  console.log('Wrote: ' + filePath);
}

console.log('Done: ' + d.length + ' SQL files generated');
