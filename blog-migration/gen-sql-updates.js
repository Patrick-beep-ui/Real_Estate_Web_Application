const fs = require('fs');
const path = require('path');
const d = require('./blog-posts-real-estate-tips.json');
const skipSlug = 'understanding-your-home-s-fair-market-value';
const posts = d.filter(p => p.slug !== skipSlug);

function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  let s = String(val);
  s = s.replace(/'/g, "''");
  return "'" + s + "'";
}

const outDir = path.join(__dirname, 'sql_updates');
fs.mkdirSync(outDir, { recursive: true });

for (const p of posts) {
  const sql = `UPDATE blog_posts SET content = ${esc(p.content)} WHERE slug = '${p.slug}';`;
  const filePath = path.join(outDir, `${p.slug}.sql`);
  fs.writeFileSync(filePath, sql);
  console.log(`Wrote: ${filePath} (${sql.length} chars)`);
}

console.log(`Done: ${posts.length} SQL files`);
