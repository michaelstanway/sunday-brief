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
5. **Write** about 4,000 words of reading plus the quiz, in this exact section order and time budget:
   - **The week in 90 seconds**: 6 numbered headlines.
   - **The world (about 6 min)**: 3 stories in depth (background, this week, what to watch), then about 8 one-liners.
   - **Markets and money (about 5 min)**: 1 big story explained, a box with Friday's closing numbers (US 10-year yield, S&P 500 and its weekly move, Brent, gold, bitcoin, plus one number relevant that week), then 3 to 4 Money Stuff and FT one-liners.
   - **The Economist's picks (about 6 min)**: 2 stories in depth with The Economist's angle in an italic `.angle` line labelled as theirs, then one line per other notable piece.
   - **Science (about 6 min)**: 1 Quanta piece explained properly (core idea, what's new, who, verbatim attributed quotes, what's uncertain), then 3 short Nature items, then "Also in science" one-liners.
   - **Space and EO (about 2 min)**: 4 to 6 items, the top 3 each with a factual "why it matters for EO operators".
   - **Quiz (about 8 min)**: exactly **20** multiple-choice questions, each with 4 options, one correct, and a one-line explanation. Spread them across all sections.
   - **Footer**: the sources used, as links.
   Plain English, short sentences, active voice. Quotes are verbatim and attributed. Label The Economist's and Money Stuff's own arguments as theirs. Give dates as weekday names within the week.
6. **Build the page.** Create `editions/<this Sunday's date>.html` as a copy of last week's edition, then replace only the content. Keep its structure exactly: the `<head>` (Google Fonts link for Newsreader and IBM Plex Mono, and `../assets/brief.css`; no inline styles), the `.masthead`, the `.strip` (`← All editions`, `Week of …`, `Take the quiz`), the `.hero` block, the `.toc`, the `<section class="part">` sections with their ids (`top`, `world`, `money`, `econ`, `sci`, `space`, `quiz`), the footer, and the quiz `<script>` (change only the `MCQ` array). In the hero, write a real headline for the week as the `<h1>` (like "The week the bond market flinched"), a one- or two-sentence `.dek`, and update the kicker line (`Sunday Brief · <date> · covers <Sun date> – <Sat date>`) and the dates in the masthead and strip. End every in-depth story with a `<p class="read">Read more: …</p>` line linking the original piece (The Economist, FT, Money Stuff, Quanta or Nature) and the free reporting you used, and end every one-liner with `<span class="src"><a …>Source ↗</a></span>`. All links open in a new tab (`target="_blank" rel="noopener"`) and must be real URLs you fetched or found, never guessed. Story lead-ins like `<strong>This week.</strong>` at the start of a paragraph are styled as small labels; use them for structure. Keep `<meta name="robots" content="noindex, nofollow">`. Never edit `assets/brief.css` unless something is broken. Check that the script parses (e.g. `node -e` with `new Function(...)`) and that there are exactly 20 questions.
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

7. **Publish.** Run `python3 build_index.py` to regenerate `index.html` (it reads the kicker line and the first three "week in 90 seconds" headlines from every edition, so keep those structures). Commit the new edition and `index.html` with a message like `Sunday Brief: 4 October 2026`, and push to `main`. Then fetch https://michaelstanway.github.io/sunday-brief/ (Pages takes a minute or two) and confirm the new edition is listed first and its page loads.

## If the network is restricted

Cloud runs may block direct page and feed fetches (curl and WebFetch return 403 or "egress blocked"). If that happens, do not stop: use WebSearch for everything, including finding each source's articles for the week (for example search "quantamagazine.org" with the week's dates, or the publication name plus the topic). Cite only URLs that appeared in search results. If the live-site check in step 7 is blocked, confirm the push succeeded instead and say so in your final report.

## Rules

- Never put anything personal or private in the page beyond the general interests listed above; it is public.
- Never change the site URL, the quiz length or the scoring, and never rename or delete past editions.
- If a source is unreachable, carry on with the rest and say so in the footer.
- Do not touch any other repository.
- Be exact about history: e.g. US troops left Iraq in 2011 and returned in 2014, so the 2026 withdrawal ended a 12-year mission, not a 23-year presence. When a source's framing and the record disagree, follow the record.
