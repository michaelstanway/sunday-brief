/*
 * Sunday Brief leaderboard.
 *
 * Fills <div class="board" data-edition="YYYY-MM-DD"></div> with that edition's
 * scores and a form to add one. Scores live in a single table that the public
 * key below can only read and add to: no edits, no deletes, 0–20 only, one
 * score per name per edition. The key is a publishable (client) key, so it is
 * safe in a public page; it opens nothing else.
 *
 * Taking the quiz is optional. The score box fills itself once all 20 questions
 * are answered, and can be typed in by anyone who did the quiz elsewhere.
 */
(function () {
  var API = "https://wxhubrugvhsdzocmpwlf.supabase.co/rest/v1/brief_score";
  var KEY = "sb_publishable_0TIsZ-j1C7xAfbt_evGWVg_yDVEjQsy";
  var H = { apikey: KEY, Authorization: "Bearer " + KEY };
  var NAME_KEY = "sunday-brief-name";

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function init(root) {
    var edition = root.getAttribute("data-edition");
    if (!edition) return;

    root.appendChild(el("p", "board-label", "Leaderboard"));
    var list = el("ol", "board-list");
    list.appendChild(el("li", "board-empty", "Loading scores…"));
    root.appendChild(list);

    var form = el("form", "board-form");
    var name = el("input"); name.type = "text"; name.maxLength = 30; name.placeholder = "Your name"; name.required = true; name.autocomplete = "nickname"; name.setAttribute("aria-label", "Your name");
    var score = el("input"); score.type = "number"; score.min = 0; score.max = 20; score.step = 1; score.placeholder = "Score"; score.required = true; score.setAttribute("aria-label", "Score out of 20");
    var out = el("span", "board-of", "/ 20");
    var go = el("button", "btn", "Add my score"); go.type = "submit";
    var msg = el("p", "board-msg"); msg.setAttribute("role", "status");
    form.appendChild(name); form.appendChild(score); form.appendChild(out); form.appendChild(go);
    root.appendChild(form); root.appendChild(msg);
    root.appendChild(el("p", "board-note", "Optional. Take the quiz below and your score fills in here when you finish, or type it in. One score per name each week."));

    var saved = store(NAME_KEY); if (saved) name.value = saved;

    function load() {
      fetch(API + "?select=name,score&edition=eq." + edition + "&order=score.desc,created_at.asc", { headers: H })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (rows) {
          list.innerHTML = "";
          if (!rows.length) { list.appendChild(el("li", "board-empty", "No scores yet. Be the first.")); return; }
          var rank = 0, last = null;
          rows.forEach(function (r, i) {
            if (r.score !== last) { rank = i + 1; last = r.score; }
            var li = el("li", "board-row");
            li.appendChild(el("span", "board-rank", String(rank)));
            li.appendChild(el("span", "board-name", r.name));
            li.appendChild(el("span", "board-score", r.score + "/20"));
            list.appendChild(li);
          });
        })
        .catch(function () { list.innerHTML = ""; list.appendChild(el("li", "board-empty", "Couldn't load the scores. Try reloading.")); });
    }

    // Fill the score from the quiz once every question is answered.
    var scoreText = document.getElementById("scoreText");
    if (scoreText) {
      new MutationObserver(function () {
        var m = /(\d+)\s*\/\s*(\d+)/.exec(scoreText.textContent);
        if (m && +m[2] === 20 && !score.dataset.touched) score.value = m[1];
      }).observe(scoreText, { childList: true, characterData: true, subtree: true });
    }
    score.addEventListener("input", function () { score.dataset.touched = "1"; });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = name.value.replace(/\s+/g, " ").trim().slice(0, 30);
      var s = Math.round(Number(score.value));
      if (!n) { msg.textContent = "Add your name first."; return; }
      if (!(s >= 0 && s <= 20)) { msg.textContent = "The score is out of 20."; return; }
      go.disabled = true; msg.textContent = "Saving…";
      fetch(API, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, H),
        body: JSON.stringify({ edition: edition, name: n, score: s }),
      })
        .then(function (r) {
          if (r.status === 409) throw new Error("That name already has a score this week.");
          if (!r.ok) throw new Error("Couldn't save. Try again in a moment.");
          store(NAME_KEY, n);
          msg.textContent = "Saved. You're on the board.";
          form.reset(); name.value = n; delete score.dataset.touched;
          load();
        })
        .catch(function (e) { msg.textContent = e.message; })
        .then(function () { go.disabled = false; });
    });

    load();
  }

  function start() { document.querySelectorAll(".board[data-edition]").forEach(init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
