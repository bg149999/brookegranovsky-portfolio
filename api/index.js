const MY_DOMAIN = 'brookegranovsky.com';
const SLUG_TO_PAGE = {
  '': '33934ab37c1d81c5b861da918fe8f85b',
  'marketing-portfolio': '33934ab37c1d81679ea7dd06d87b1dea',
  'art-portfolio': '33934ab37c1d81fdb3caf3b89f15e294',
};
const PAGE_TITLE = 'Brooke Granovsky - Portfolio';
const PAGE_DESCRIPTION = 'Brooke Granovsky is a lawyer and writer with roots in tech marketing, creative writing, and social justice. J.D., Western University. B.A., Brandeis University.';

module.exports = async (req, res) => {
  const path = req.url.split('?')[0].slice(1);
  if (path === 'robots.txt') {
    res.setHeader('Content-Type', 'text/plain');
    return res.send('User-agent: *\nAllow: /\nSitemap: https://' + MY_DOMAIN + '/sitemap.xml');
  }
  if (path === 'sitemap.xml') {
    const urls = Object.keys(SLUG_TO_PAGE).map(s => '<url><loc>https://' + MY_DOMAIN + '/' + s + '</loc></url>').join('');
    res.setHeader('Content-Type', 'application/xml');
    return res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + '</urlset>');
  }
  let pageId = SLUG_TO_PAGE[''];
  if (path in SLUG_TO_PAGE) { pageId = SLUG_TO_PAGE[path]; }
  const notionUrl = 'https://www.notion.so/' + pageId;
  try {
    const response = await fetch(notionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    let body = await response.text();
    const slug = Object.entries(SLUG_TO_PAGE).find(([, id]) => id === pageId)?.[0] ?? '';
    const canonicalUrl = 'https://' + MY_DOMAIN + '/' + slug;
    const seoTags = '<meta property="og:title" content="' + PAGE_TITLE + '"><meta property="og:description" content="' + PAGE_DESCRIPTION + '"><meta property="og:url" content="' + canonicalUrl + '"><meta name="description" content="' + PAGE_DESCRIPTION + '"><link rel="canonical" href="' + canonicalUrl + '">';
    body = body.replace('</head>', seoTags + '</head>');
    for (const [slug, id] of Object.entries(SLUG_TO_PAGE)) {
      if (slug) {
        body = body.split('/' + id).join('/' + slug);
        const hyphenated = id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
        body = body.split('/' + hyphenated).join('/' + slug);
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(body);
  } catch (err) {
    res.status(502);
    return res.send('Failed to load page. Please try again.');
  }
};
