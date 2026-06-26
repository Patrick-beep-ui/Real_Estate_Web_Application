const d = require('./blog-posts-real-estate-tips.json');
const skipSlug = 'understanding-your-home-s-fair-market-value';
const posts = d.filter(p => p.slug !== skipSlug);

function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  let s = String(val);
  s = s.replace(/'/g, "''");
  return "'" + s + "'";
}

for (const p of posts) {
  const sql = `UPDATE blog_posts SET content = ${esc(p.content)} WHERE slug = '${p.slug}';`;
  console.log(sql);
}
