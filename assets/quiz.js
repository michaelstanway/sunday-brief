/* Sunday Brief quiz engine.
   Reads <script type="application/json" id="quiz"> ({"questions": [...]}) and renders it into #quiz-root.
   Formats: mcq, multi, order, estimate, match, written. Each question is worth exactly 1 point.
   The score line (#scoreText) reads "Score: S out of 20 · N of 20 answered" while in progress and
   "Score: S / 20" once every question is answered, which is when assets/scores.js picks it up. */
(function () {
  "use strict";
  var data, root, scoreEl, total, score = 0, answered = 0;

  function el(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function button(cls, text, parent) { var b = el("button", cls, text, parent); b.type = "button"; return b; }
  // Small seeded shuffle so the scrambled order is the same on every load.
  function rng(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function shuffled(n, seed) {
    var idx = [], r = rng(seed + 7), i, j, t;
    for (i = 0; i < n; i++) idx.push(i);
    for (var tries = 0; tries < 20; tries++) {
      for (i = n - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      if (idx.some(function (v, k) { return v !== k; })) break;
    }
    return idx;
  }
  function fmt(v, dp) { return Number(v).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }

  function show() {
    scoreEl.textContent = answered >= total
      ? "Score: " + score + " / " + total
      : "Score: " + score + " out of " + total + " · " + answered + " of " + total + " answered";
  }
  function finish(box, exp, ok, text) {
    if (box.dataset.done) return;
    box.dataset.done = "1";
    box.classList.add(ok ? "qz-ok" : "qz-miss");
    answered++; if (ok) score++;
    exp.textContent = (ok ? "Right. " : "Not quite. ") + text;
    exp.hidden = false;
    box.querySelectorAll("button, input, select, textarea").forEach(function (x) { if (!x.classList.contains("qz-keep")) x.disabled = true; });
    show();
  }

  var R = {};
  R.mcq = function (item, box, exp) {
    var opts = el("div", "opts", null, box);
    item.o.forEach(function (text, j) {
      var b = button("opt", text, opts);
      b.addEventListener("click", function () {
        var all = opts.querySelectorAll("button");
        all[item.a].classList.add("right");
        if (j !== item.a) b.classList.add("wrong");
        finish(box, exp, j === item.a, item.e);
      });
    });
  };
  R.multi = function (item, box, exp) {
    el("p", "qz-help", "Pick every answer that applies, then press Check. The point is for the exact set.", box);
    var opts = el("div", "opts", null, box), picked = {};
    var btns = item.o.map(function (text, j) {
      var b = button("opt qz-pick", text, opts);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { picked[j] = !picked[j]; b.setAttribute("aria-pressed", String(!!picked[j])); });
      return b;
    });
    var go = button("btn", "Check", el("div", "qz-actions", null, box));
    go.addEventListener("click", function () {
      var ok = true;
      btns.forEach(function (b, j) {
        var want = item.a.indexOf(j) >= 0;
        if (want) b.classList.add("right"); else if (picked[j]) b.classList.add("wrong");
        if (want !== !!picked[j]) ok = false;
      });
      finish(box, exp, ok, item.e);
    });
  };
  R.order = function (item, box, exp, qi) {
    el("p", "qz-help", item.help || "Use the arrows to put the items in order, then press Check.", box);
    var order = shuffled(item.items.length, qi);
    var list = el("ol", "qz-order", null, box);
    if (item.ends) {
      var ends = el("div", "qz-ends", null, box);
      el("span", null, "Top: " + item.ends[0], ends); el("span", null, "Bottom: " + item.ends[1], ends);
      box.insertBefore(ends, list);
    }
    function draw() {
      list.innerHTML = "";
      order.forEach(function (v, k) {
        var li = el("li", "qz-row", null, list);
        el("span", "qz-row-text", item.items[v], li);
        var up = button("qz-move", "↑", li), down = button("qz-move", "↓", li);
        up.setAttribute("aria-label", "Move up"); down.setAttribute("aria-label", "Move down");
        up.disabled = k === 0 || !!box.dataset.done; down.disabled = k === order.length - 1 || !!box.dataset.done;
        up.addEventListener("click", function () { var t = order[k - 1]; order[k - 1] = order[k]; order[k] = t; draw(); });
        down.addEventListener("click", function () { var t = order[k + 1]; order[k + 1] = order[k]; order[k] = t; draw(); });
        if (box.dataset.done) li.classList.add(v === k ? "right" : "wrong");
      });
    }
    draw();
    var go = button("btn", "Check", el("div", "qz-actions", null, box));
    go.addEventListener("click", function () {
      var ok = order.every(function (v, k) { return v === k; });
      finish(box, exp, ok, "Correct order: " + item.items.map(function (t, k) { return (k + 1) + ". " + t; }).join("  ") + ". " + item.e);
      draw();
    });
    box._order = order;
  };
  R.estimate = function (item, box, exp) {
    var dp = item.dp || 0, u = function (v) { return (item.prefix || "") + fmt(v, dp) + (item.unit || ""); };
    var start = item.start != null ? item.start : item.min + (item.max - item.min) / 2;
    var wrap = el("label", "qz-est", null, box);
    var top = el("span", "qz-est-top", null, wrap);
    el("span", null, "Your estimate", top);
    var out = el("strong", null, u(start), top);
    var input = el("input", null, null, wrap);
    input.type = "range"; input.min = item.min; input.max = item.max; input.step = item.step || 1; input.value = start;
    input.addEventListener("input", function () { out.textContent = u(Number(input.value)); });
    el("p", "qz-help", "The point is yours if you are within " + (item.tolText || ("±" + u(item.tol).replace(item.prefix || "", (item.prefix || "")))) + ".", box);
    var go = button("btn", "Lock in", el("div", "qz-actions", null, box));
    go.addEventListener("click", function () {
      var v = Number(input.value), ok = Math.abs(v - item.answer) <= item.tol + 1e-9;
      finish(box, exp, ok, "You said " + u(v) + "; the answer is " + u(item.answer) + ". " + item.e);
    });
  };
  R.match = function (item, box, exp, qi) {
    el("p", "qz-help", "Pick the partner for each item, then press Check.", box);
    var rightOrder = shuffled(item.right.length, qi + 3);
    var grid = el("div", "qz-match", null, box), sels = [];
    item.left.forEach(function (text, i) {
      var row = el("label", "qz-match-row", null, grid);
      el("span", "qz-match-left", text, row);
      var s = el("select", null, null, row);
      var o0 = el("option", null, "Choose…", s); o0.value = "";
      rightOrder.forEach(function (ri) { var o = el("option", null, item.right[ri], s); o.value = String(ri); });
      sels.push(s);
    });
    var go = button("btn", "Check", el("div", "qz-actions", null, box));
    go.addEventListener("click", function () {
      if (sels.some(function (s) { return s.value === ""; })) { exp.hidden = false; exp.textContent = "Pick a partner for every item first."; return; }
      var ok = true;
      sels.forEach(function (s, i) { var good = Number(s.value) === i; s.parentNode.classList.add(good ? "right" : "wrong"); if (!good) ok = false; });
      finish(box, exp, ok, "Pairs: " + item.left.map(function (t, i) { return t + " → " + item.right[i]; }).join("; ") + ". " + item.e);
    });
  };
  R.written = function (item, box, exp) {
    el("p", "qz-help", "Write two or three sentences, then compare with the model answer and mark yourself honestly.", box);
    var ta = el("textarea", "qz-text", null, box);
    ta.rows = 4; ta.setAttribute("aria-label", "Your answer");
    var acts = el("div", "qz-actions", null, box);
    var reveal = button("btn", "Show model answer", acts);
    var model = el("div", "qz-model", null, box); model.hidden = true;
    el("p", "qz-model-label", "Model answer", model);
    el("p", null, item.model, model);
    el("p", "qz-model-label", "You get the point if your answer:", model);
    var ul = el("ul", null, null, model);
    item.points.forEach(function (p) { el("li", null, p, ul); });
    var mark = el("div", "qz-actions", null, model);
    var yes = button("btn", "I got it: 1 point", mark), no = button("btn ghost", "Not this time: 0", mark);
    reveal.addEventListener("click", function () { model.hidden = false; reveal.disabled = true; });
    yes.addEventListener("click", function () { finish(box, exp, true, item.e); });
    no.addEventListener("click", function () { finish(box, exp, false, item.e); });
  };

  var LABEL = { mcq: "Pick one", multi: "Pick all that apply", order: "Put in order", estimate: "Estimate", match: "Match", written: "Written" };
  function build() {
    root.innerHTML = ""; score = 0; answered = 0;
    data.questions.forEach(function (item, i) {
      var box = el("div", "q qz qz-" + item.type, null, root);
      box.dataset.type = item.type;
      var head = el("p", "qt", null, box);
      el("span", "qz-tag", (i + 1) + " · " + (LABEL[item.type] || item.type), head);
      head.appendChild(document.createTextNode(item.q));
      var exp = el("p", "explain");
      exp.hidden = true;
      (R[item.type] || R.mcq)(item, box, exp, i);
      box.appendChild(exp);
    });
    show();
  }
  function init() {
    var src = document.getElementById("quiz-data") || document.querySelector('script[type="application/json"]#quiz');
    root = document.getElementById("quiz-root");
    scoreEl = document.getElementById("scoreText");
    if (!src || !root || !scoreEl) return;
    try { data = JSON.parse(src.textContent); } catch (e) { root.textContent = "The quiz couldn't load."; if (window.console) console.error(e); return; }
    total = data.questions.length;
    build();
    var reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", build);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
