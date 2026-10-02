#!/usr/bin/env python3
"""
Rebuild index.html: the list of every edition, newest first.

Each edition lives at editions/YYYY-MM-DD.html. This reads each one's
headline (the hero <h1>), its kicker line and its first three "week in 90
seconds" items, then writes index.html using assets/brief.css. Run it after
adding an edition:

    python3 build_index.py
"""
import datetime as dt
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
editions = sorted((ROOT / "editions").glob("????-??-??.html"), reverse=True)


def text(fragment: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def pretty(stem: str) -> str:
    d = dt.date.fromisoformat(stem)
    return f"{d.day} {d.strftime('%B %Y')}"


def read(path: pathlib.Path) -> dict:
    s = path.read_text(encoding="utf-8")
    h1 = re.search(r'<div class="hero-text">.*?<h1>(.*?)</h1>', s, re.S)
    kicker = re.search(r'<div class="kicker">(.*?)</div>', s, re.S)
    cover = ""
    if kicker:
        parts = [p.strip() for p in text(kicker.group(1)).split("·")]
        cover = parts[-1] if len(parts) > 2 else ""
    heads = []
    top = re.search(r'id="h-top".*?<ol>(.*?)</ol>', s, re.S)
    if top:
        for li in re.findall(r"<li>(.*?)</li>", top.group(1), re.S)[:3]:
            b = re.search(r"<strong>(.*?)</strong>", li, re.S)
            heads.append(text(b.group(1) if b else li))
    return {"title": text(h1.group(1)) if h1 else pretty(path.stem), "cover": cover, "heads": heads}


def esc(s: str) -> str:
    return html.escape(s, quote=True)


if editions:
    first = read(editions[0])
    items = "".join(f"<li>{esc(h)}</li>" for h in first["heads"])
    latest = f"""
    <a class="latest" href="editions/{editions[0].name}">
      <div class="inner">
        <span class="label">This week · {esc(pretty(editions[0].stem))}{' · ' + esc(first['cover']) if first['cover'] else ''}</span>
        <span class="title">{esc(first['title'])}</span>
        <ul>{items}</ul>
        <span class="go">Read it, then take the twenty-question quiz →</span>
      </div>
    </a>"""
else:
    latest = '<p class="meta">The first edition arrives on Sunday morning.</p>'

rows = []
for p in editions[1:]:
    e = read(p)
    rows.append(f'<li><a href="editions/{p.name}"><span class="d">{esc(pretty(p.stem))}</span><span class="t">{esc(e["title"])}</span></a></li>')
past = "\n        ".join(rows) if rows else '<li class="none">Earlier editions will appear here.</li>'

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Sunday Brief</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/brief.css">
</head>
<body>
<div class="masthead">
  <a class="mark" href="./"><span class="sun" aria-hidden="true">S</span><span>Sunday<br>Brief</span></a>
  <span class="edition-date">Every Sunday morning</span>
</div>
<div class="strip"><div class="strip-inner">
  <span>Editions</span>
  <span>{len(editions)} so far</span>
</div></div>
<main class="list-wrap">
  <div class="intro">
    <h1>The week, in thirty minutes.</h1>
    <p>Eight stories explained properly and everything else in a line, picked from The Economist, the FT, Money Stuff, Quanta, Nature and the space trade press. A twenty-question quiz at the end checks what stuck.</p>
  </div>
  {latest}
  <section class="past" aria-labelledby="past-h">
    <h2 id="past-h">Earlier editions</h2>
    <ol>
        {past}
    </ol>
  </section>
</main>
</body>
</html>
"""
(ROOT / "index.html").write_text(page, encoding="utf-8")
print(f"index.html: {len(editions)} edition(s)")
