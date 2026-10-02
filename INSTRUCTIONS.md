# How to build the Sunday Brief

You are building this week's edition of the Sunday Brief: a 30-minute weekly news read with a 20-question quiz at the bottom. Each edition is its own page at `editions/YYYY-MM-DD.html` (the Sunday's date). `index.html` is the list of all editions, newest first, and is published at https://michaelstanway.github.io/sunday-brief/ (GitHub Pages, `main` branch). The reader opens that same URL every Sunday morning, clicks this week's edition, and enters his quiz score in an app, so the URL, the 20-question quiz and the score-out-of-20 must never change.

## The week you are covering

The edition is dated the Sunday you run on. It covers **the seven days ending the day before** (Sunday to Saturday). Use only facts published by the moment you run. Never use anything you cannot source.

## Steps

1. **Start from last week's edition.** Open the newest file in `editions/`; you will reuse its design (step 6). Never edit or delete past editions.
2. **Collect candidate stories** from these sources. Headlines come from feeds; facts come from free reporting (step 3).
   - The Economist, latest issue: `https://www.economist.com/<section>/rss.xml` for sections `the-world-this-week`, `leaders`, `briefing`, `united-states`, `britain`, `europe`, `china`, `asia`, `the-americas`, `middle-east-and-africa`, `international`, `business`, `finance-and-economics`, `science-and-technology`, `culture`. Fetch with `curl -s -A "Mozilla/5.0 (compatible; RSSReader/1.0)"`. Article pages are paywalled; use only titles and descriptions.
   - Financial Times: `https://www.ft.com/<section>?format=rss` for `world`, `global-economy`, `markets`, `companies`, `technology`, `science`, `climate-capital`, `opinion`, `lex`, `the-big-read`. Feeds only hold the latest 25 items.
   - Money Stuff (Matt Levine): `https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss` (headlines only; research the news behind each).
   - Quanta: `https://www.quantamagazine.org/feed/` (full articles are free; read the chosen one in full).
   - Nature news: `https://www.nature.com/nature.rss` (news items have URLs containing `d41586`; ignore research papers). Pages may need `curl` with a cookie jar.
   - Space and Earth observation: `https://payloadspace.com/feed/`, `https://spacenews.com/feed/`, plus searches.
   - Wikipedia Current events, one page per day: `https://en.wikipedia.org/w/index.php?title=Portal:Current_events/2026_September_27&action=raw` (adjust the date).
3. **Research.** Use subagents in parallel (world, markets and money, The Economist's picks, science, space and EO). Every fact comes from a free, reputable source (Reuters, AP, BBC, Al Jazeera, NPR, CNBC, France 24, central banks, journals, company releases). Check every number and quote in the top stories against at least two outlets. If you can't confirm something, leave it out or say "reportedly". Never reconstruct the text of a paywalled article from its headline.
4. **Select.** About 8 stories in depth, everything else one line. Priority order:
   1. Covered by two or more sources.
   2. Still matters in a year (rates, elections, wars, big science).
   3. Relevant to the reader: space and Earth observation (he works in EO satellite data), AI, the UK and California, and everyday health and supplements.
   4. One "wonder" piece a week, usually from Quanta.
   5. Conflict, crime and disasters together take no more than a third of the page.
   Drop single-day incidents unless huge, keep sport to a line, and drop anything only one source mentions.
5. **Write** the edition as **10 story sheets** plus the extras, following the 27 September edition exactly:
   - **The week in 90 seconds**: 6 numbered headlines.
   - **Sheets 1–3, the world**: the three biggest world stories.
   - **Sheet 4, markets and money**: the week's big money story, with a "Friday's closing numbers" table (US 10-year yield, S&P 500 and weekly move, Brent, gold, bitcoin).
   - **Sheets 5–6, The Economist's picks**: two of its stories in depth, with its argument as a labelled quote.
   - **Sheet 7, the wonder piece**: usually Quanta, explained properly.
   - **Sheet 8, science notebook**: 4–5 short items from Nature and elsewhere, always including **at least one item on machine learning, AI research or data compression** (new methods, benchmarks, codecs, notable papers) when one exists that week.
   - **Sheet 9, space and Earth observation**: 4–6 items plus a "why it matters for EO operators" table.
   - **Sheet 10, off the map**: one place worth knowing about and one piece of history, ideally tied to the week's news (an Economist travel or culture piece, an archaeology find, an anniversary). Sourced, never invented.
   - **Also this week**: one-liners in three columns (the world; Money Stuff and the FT; the rest of The Economist), each with a source link.
   - **Quiz**: exactly **20** questions.
   Each sheet is a grid of labelled panels (A, B, C…) in this order where possible: **What happened** (a numbered list of short sentences), an **interactive figure**, **Key numbers** (a table, or bars only when the values share one unit and scale), **context** (a status table, timeline or quotes), **What to watch**, and a **Title block** (story, dates, sheet number, "Read more" source links). Use the `panel`, `steps`, `watch`, `kn`, `table` and `tb` patterns exactly as in the 27 September edition's HTML.

   **Writing style: about 80% of the way to ASD-STE100 (Simplified Technical English).** One idea per sentence. Most sentences under 20 words, none over 25. Active voice. Simple, common words; the same word for the same thing every time. No more than 6 sentences in a paragraph or list. Quotes are verbatim and attributed. Label The Economist's and Money Stuff's own arguments as theirs. Give dates as weekday names within the week.
6. **Build the page.** Create `editions/<this Sunday's date>.html` as a copy of last week's edition, then replace only the content. Keep its structure exactly: the `<head>` (Google Fonts link for Newsreader and IBM Plex Mono, and `../assets/brief.css`; no inline styles), the `.masthead`, the `.strip` (`← All editions`, `Week of …`, `Take the quiz`), the `.hero` block, the `.toc`, the `<section class="part">` sections with their ids (`top`, `world`, `money`, `econ`, `sci`, `space`, `quiz`), the footer, and the quiz `<script>` (change only the `MCQ` array). In the hero, write a real headline for the week as the `<h1>` (like "The week the bond market flinched"), a one- or two-sentence `.dek`, and update the kicker line (`Sunday Brief · <date> · covers <Sun date> – <Sat date>`) and the dates in the masthead and strip. End every in-depth story with a `<p class="read">Read more: …</p>` line linking the original piece (The Economist, FT, Money Stuff, Quanta or Nature) and the free reporting you used, and end every one-liner with `<span class="src"><a …>Source ↗</a></span>`. All links open in a new tab (`target="_blank" rel="noopener"`) and must be real URLs you fetched or found, never guessed. Story lead-ins like `<strong>This week.</strong>` at the start of a paragraph are styled as small labels; use them for structure. Keep `<meta name="robots" content="noindex, nofollow">`. Never edit `assets/brief.css` unless something is broken. The new edition links its assets as `../assets/brief.css?v=YYYYMMDD` and `../assets/interactive.js?v=YYYYMMDD` (the edition date), so browsers fetch fresh copies; if you change either asset file, also update the `?v=` on every edition so readers get the change. Check that the script parses (e.g. `node -e` with `new Function(...)`) and that there are exactly 20 questions.
6b. **Make it interactive.** Every edition includes 6 to 10 interactive figures and 10 to 20 glossary terms, using the components in `assets/interactive.js` (already loaded by the edition template with `<script src="../assets/interactive.js" defer></script>`). Place each figure right after the paragraph it explains, as `<div class="fig" data-fig="NAME" data-config="{...JSON, HTML-escaped...}"></div>`. Available figures and their configs (see the 27 September edition for working examples):
   - `timeline` — `{"title", "events": [{"date": "YYYY-MM-DD", "label", "text"}]}`: background for a long-running story.
   - `predict` — `{"question", "min", "max", "step", "unit"?, "prefix"?, "dp"?, "answer", "explain"}`: the reader guesses a striking sourced number before seeing it. Use 2 to 4 per edition.
   - `polls` — `{"title", "note", "polls": [{"name", "moe", "rows": [{"name", "v", "color"}], "text"}]}`: polls with margins of error.
   - `seats` — `{"title", "note", "win", "parties": [{"name", "seats", "color", "blocked"?}]}`: a coalition builder for a parliament.
   - `hormuz` — `{"states": [{"label", "perDay", "text"}]}`: animated traffic through a chokepoint (reuse while Hormuz is in the news).
   - `mortgage` — `{"refs": [{"label", "rate"}]}`: what a rate change does to monthly payments.
   - `seesaw` (no config): why bond prices fall when yields rise.
   - `holo` and `tug` (no config): written for the 27 September science stories; reuse only if the topic recurs.
   Every number in a config must come from the edition's sourced text; anything illustrative must say so in the figure's note. If a week's hardest concept needs a new kind of figure, add it to `assets/interactive.js` following the existing pattern (a `FIGS.name = function (node, cfg)` using the `frame`, `slider`, `toggles`, `svg` helpers and only CSS variables from `assets/brief.css`), test it renders, and keep it working for past editions. Glossary terms: wrap the first use of each piece of jargon as `<dfn data-def="one plain-English sentence">term</dfn>` (never inside headings, links or figure configs).

6c. **Three levels of depth (progressive disclosure).** Level 1 is the 90-second headlines and each sheet's "What happened" steps. Level 2 is the panels and figures. Level 3 is a `<details class="deeper"><summary>Go deeper: …</summary><div class="deeper-body">…</div></details>` block at the end of every sheet's "What happened" panel (and on any science item with real evidence behind it), holding the fuller account: background, the evidence and numbers, caveats, and attributed quotes, 3 to 5 short paragraphs, each starting with a `<strong>` label. Nothing important is cut from the page; it moves down a level.

6d. **A problem for every figure.** Each figure's config carries a `"problem"`: `{"type": "choice", "text", "options", "answer", "why", "hint"}` for a question answered by using the figure; `{"type": "check", "check": "<name>", …params, "text", "hint", "miss", "why"}` for a target the reader must reach by moving the controls (checks live in `CHECKS` in `assets/interactive.js`; add one when a new figure needs it); or `{"type": "predict", "text", "why"}` on predict figures. Problems should teach the story's key idea, not trivia. The page counts problems solved.

6e. **People cards.** Wrap the first mention of each key person as `<span class="who" data-who="key">Name</span>`, and include a `<script type="application/json" id="people">` block mapping each key to `{"name", "role", "bio", "img", "url"}`, taken from Wikipedia's REST summary API (`https://en.wikipedia.org/api/rest_v1/page/summary/<Title>`: `description`, the first two sentences of `extract`, `thumbnail.source`, `content_urls.desktop.page`). If the summary describes events after the edition date, rewrite the role and bio to what was true on the edition date.

7. **Publish.** Run `python3 build_index.py` to regenerate `index.html` (it reads the kicker line and the first three "week in 90 seconds" headlines from every edition, so keep those structures). Commit the new edition and `index.html` with a message like `Sunday Brief: 4 October 2026`, and push to `main`. Then fetch https://michaelstanway.github.io/sunday-brief/ (Pages takes a minute or two) and confirm the new edition is listed first and its page loads.

## If the network is restricted

Cloud runs may block direct page and feed fetches (curl and WebFetch return 403 or "egress blocked"). If that happens, do not stop: use WebSearch for everything, including finding each source's articles for the week (for example search "quantamagazine.org" with the week's dates, or the publication name plus the topic). Cite only URLs that appeared in search results. If the live-site check in step 7 is blocked, confirm the push succeeded instead and say so in your final report.

## Rules

- Never put anything personal or private in the page beyond the general interests listed above; it is public.
- Never change the site URL, the quiz length or the scoring, and never rename or delete past editions.
- If a source is unreachable, carry on with the rest and say so in the footer.
- Do not touch any other repository.
- Be exact about history: e.g. US troops left Iraq in 2011 and returned in 2014, so the 2026 withdrawal ended a 12-year mission, not a 23-year presence. When a source's framing and the record disagree, follow the record.
