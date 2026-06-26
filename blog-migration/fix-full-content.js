const d = require('./blog-posts-real-estate-tips.json');
const skipSlug = 'understanding-your-home-s-fair-market-value';
const posts = d.filter(p => p.slug !== skipSlug);

for (const p of posts) {
  const content = p.content;
  // Use dollar-quoting with a unique tag
  console.log(`UPDATE blog_posts SET content = $content_${p.slug}$\n${content}\n$content_${p.slug}$ WHERE slug = '${p.slug}';`);
}
