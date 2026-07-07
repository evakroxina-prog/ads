"""Add hreflang cs links to RU blog articles and extend sitemap."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
articles = json.loads((root / "cz" / "blog" / "articles.json").read_text(encoding="utf-8"))
ru_to_cs = {a["ruSlug"]: a["slug"] for a in articles}

# --- hreflang on RU articles ---
for ru_slug, cs_slug in ru_to_cs.items():
    p = root / "blog" / ru_slug / "index.html"
    if not p.exists():
        print("missing RU", ru_slug)
        continue
    html = p.read_text(encoding="utf-8")
    cs_url = f"https://ads.marketexpert.cz/cz/blog/{cs_slug}/"
    ru_url = f"https://ads.marketexpert.cz/blog/{ru_slug}/"
    if 'hreflang="cs"' in html:
        print("skip hreflang", ru_slug)
        continue
    # insert cs alternate after ru alternate
    html = html.replace(
        f'<link rel="alternate" hreflang="ru" href="{ru_url}">',
        f'<link rel="alternate" hreflang="ru" href="{ru_url}">\n<link rel="alternate" hreflang="cs" href="{cs_url}">',
        1,
    )
  # blog hub x-default stays ru for RU articles
    p.write_text(html, encoding="utf-8")
    print("hreflang RU", ru_slug)

# RU blog hub
hub = root / "blog" / "index.html"
hub_html = hub.read_text(encoding="utf-8")
if 'hreflang="cs"' not in hub_html:
    hub_html = hub_html.replace(
        '<link rel="alternate" hreflang="ru" href="https://ads.marketexpert.cz/blog/">',
        '<link rel="alternate" hreflang="ru" href="https://ads.marketexpert.cz/blog/">\n<link rel="alternate" hreflang="cs" href="https://ads.marketexpert.cz/cz/blog/">',
    )
    hub.write_text(hub_html, encoding="utf-8")
    print("hreflang RU hub")

# --- sitemap ---
sitemap_path = root / "sitemap.xml"
xml = sitemap_path.read_text(encoding="utf-8")

# blog hub cs
if "cz/blog/" not in xml:
    blog_hub_cs = """  <url>
    <loc>https://ads.marketexpert.cz/cz/blog/</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="https://ads.marketexpert.cz/blog/"/>
    <xhtml:link rel="alternate" hreflang="cs" href="https://ads.marketexpert.cz/cz/blog/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ads.marketexpert.cz/cz/blog/"/>
    <lastmod>2026-07-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
"""
    xml = xml.replace(
        """  <url>
    <loc>https://ads.marketexpert.cz/blog/</loc>
    <lastmod>2026-07-03</lastmod>""",
        """  <url>
    <loc>https://ads.marketexpert.cz/blog/</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="https://ads.marketexpert.cz/blog/"/>
    <xhtml:link rel="alternate" hreflang="cs" href="https://ads.marketexpert.cz/cz/blog/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ads.marketexpert.cz/cz/blog/"/>
    <lastmod>2026-07-07</lastmod>""",
    )
    # insert cs hub after ru blog url block
    insert_after = """  <url>
    <loc>https://ads.marketexpert.cz/blog/</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="https://ads.marketexpert.cz/blog/"/>
    <xhtml:link rel="alternate" hreflang="cs" href="https://ads.marketexpert.cz/cz/blog/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://ads.marketexpert.cz/cz/blog/"/>
    <lastmod>2026-07-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
"""
    xml = xml.replace(insert_after, insert_after + blog_hub_cs)

for a in articles:
    ru_slug = a["ruSlug"]
    cs_slug = a["slug"]
    date = a["date"]
    ru_loc = f"https://ads.marketexpert.cz/blog/{ru_slug}/"
    cs_loc = f"https://ads.marketexpert.cz/cz/blog/{cs_slug}/"
    if cs_loc in xml:
        continue
    # update RU entry if exists without hreflang
    ru_block_old = f"""  <url>
    <loc>{ru_loc}</loc>
    <lastmod>"""
    ru_block_new = f"""  <url>
    <loc>{ru_loc}</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="{ru_loc}"/>
    <xhtml:link rel="alternate" hreflang="cs" href="{cs_loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{cs_loc}"/>
    <lastmod>"""
    if ru_block_old in xml and "hreflang" not in xml[xml.find(ru_loc):xml.find(ru_loc)+400]:
        xml = xml.replace(ru_block_old, ru_block_new, 1)
    cs_block = f"""  <url>
    <loc>{cs_loc}</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="{ru_loc}"/>
    <xhtml:link rel="alternate" hreflang="cs" href="{cs_loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{cs_loc}"/>
    <lastmod>{date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
"""
    xml = xml.replace("</urlset>", cs_block + "</urlset>")
    print("sitemap", cs_slug)

sitemap_path.write_text(xml, encoding="utf-8")
print("done")
