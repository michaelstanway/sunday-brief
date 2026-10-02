#!/usr/bin/env python3
"""
Rebuild index.html: the list of every edition, newest first.

Each edition lives at editions/YYYY-MM-DD.html. This reads each one's kicker
line and headline items so the list can show what each week covered, then
writes index.html in the same forest design. Run it after adding an edition:

    python3 build_index.py
"""
import html, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent
editions = sorted((ROOT / "editions").glob("????-??-??.html"), reverse=True)


def pretty(stem: str) -> str:
    import datetime as dt
    d = dt.date.fromisoformat(stem)
    return f"{d.day} {d.strftime('%B %Y')}"


def summary(path: pathlib.Path) -> tuple[str, list[str]]:
    s = path.read_text(encoding="utf-8")
    kicker = re.search(r'<div class="kicker">(.*?)</div>', s, re.S)
    cover = ""
    if kicker:
        parts = [p.strip() for p in html.unescape(re.sub(r"<[^>]+>", "", kicker.group(1))).split("·")]
        cover = parts[-1] if len(parts) > 2 else ""
    top = re.search(r'id="h-top".*?<ol>(.*?)</ol>', s, re.S)
    heads = []
    if top:
        for li in re.findall(r"<li>(.*?)</li>", top.group(1), re.S)[:3]:
            b = re.search(r"<strong>(.*?)</strong>", li, re.S)
            heads.append(html.unescape(re.sub(r"<[^>]+>", "", (b or re.match(r"(.*)", li)).group(1))).strip())
    return cover, heads


def card(path: pathlib.Path, latest: bool) -> str:
    cover, heads = summary(path)
    items = "".join(f"<li>{html.escape(h)}</li>" for h in heads)
    label = "This week" if latest else pretty(path.stem)
    return f"""
    <a class="ed{' latest' if latest else ''}" href="editions/{path.name}">
      <span class="when">{html.escape(label)}{' · ' + html.escape(pretty(path.stem)) if latest else ''}</span>
      <span class="cover">{html.escape(cover.capitalize()) if cover else ''}</span>
      <ul>{items}</ul>
      <span class="go">{'Read this week’s brief and take the quiz →' if latest else 'Read →'}</span>
    </a>"""


cards = "".join(card(p, i == 0) for i, p in enumerate(editions)) or '<p class="meta">No editions yet.</p>'

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Sunday Brief</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Layout: one column; the newest edition as a feature card, earlier weeks as a list below. */
:root {{
  --bg: #edf1ea; --paper: #f8faf5; --ink: #18261d; --muted: #55665b; --rule: #cfd9cc;
  --accent: #2e5a3e; --accent-soft: #dfeadf; --brass: #8a6d34;
  --display: "Fraunces", Georgia, serif; --body: "Source Serif 4", Georgia, serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg: #0e1611; --paper: #15201a; --ink: #e3eae2; --muted: #9db0a2; --rule: #26352b;
    --accent: #86c597; --accent-soft: #1b3324; --brass: #c8a964; color-scheme: dark;
  }}
}}
:root[data-theme="dark"] {{
  --bg: #0e1611; --paper: #15201a; --ink: #e3eae2; --muted: #9db0a2; --rule: #26352b;
  --accent: #86c597; --accent-soft: #1b3324; --brass: #c8a964; color-scheme: dark;
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 17px; line-height: 1.6; }}
.wrap {{ max-width: 44rem; margin: 0 auto; padding-inline: 18px; padding-block: 48px 72px; display: grid; gap: 22px; }}
.kicker {{ font-family: var(--mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--brass); }}
h1 {{ font-family: var(--display); font-weight: 600; font-size: clamp(2.2rem, 7vw, 3.2rem); line-height: 1.04; margin: 0; }}
.meta {{ color: var(--muted); font-size: 15px; margin: 0; }}
header {{ display: grid; gap: 10px; padding-bottom: 22px; border-bottom: 1px solid var(--rule); }}
.list {{ display: grid; gap: 12px; }}
.ed {{ display: grid; gap: 6px; padding: 16px 18px; border: 1px solid var(--rule); border-radius: 8px; background: var(--paper); color: inherit; text-decoration: none; }}
.ed:hover {{ border-color: var(--accent); }}
.ed:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.ed.latest {{ padding: 22px 22px; border-color: var(--accent); }}
.when {{ font-family: var(--display); font-weight: 600; font-size: 1.25rem; }}
.latest .when {{ font-size: 1.6rem; }}
.cover {{ font-family: var(--mono); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }}
.ed ul {{ margin: 4px 0 0; padding-left: 1.1em; display: grid; gap: 3px; font-size: 15.5px; }}
.ed:not(.latest) ul {{ display: none; }}
.go {{ font-family: var(--mono); font-size: 13px; color: var(--accent); }}
h2 {{ font-family: var(--display); font-weight: 600; font-size: 1.2rem; margin: 10px 0 0; }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">A weekly read · every Sunday morning</div>
    <h1>Sunday Brief</h1>
    <p class="meta">The week's news in about thirty minutes, picked from The Economist, the FT, Money Stuff, Quanta, Nature and the space trade press, with a twenty-question quiz at the end.</p>
  </header>
  <div class="list">{cards}
  </div>
</div>
</body>
</html>
"""
(ROOT / "index.html").write_text(page, encoding="utf-8")
print(f"index.html: {len(editions)} edition(s)")
