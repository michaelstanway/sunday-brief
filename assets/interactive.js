/*
 * Sunday Brief — interactive figures.
 *
 * Every figure is a <div class="fig" data-fig="NAME" data-config='{...}'>
 * placed in an edition. This file finds them and draws them. Figures are
 * plain SVG and DOM, no libraries, so a page works offline and loads fast.
 *
 * Numbers that are facts come from the edition's sourced text via
 * data-config; anything purely illustrative says so on the figure.
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function svg(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(n, dp) { return Number(n).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }
  function slider(parent, label, min, max, step, value, onInput, suffix) {
    var wrap = el("label", { class: "fx-slider" }, parent);
    var top = el("span", { class: "fx-slider-top" }, wrap);
    el("span", null, top, label);
    var out = el("span", { class: "fx-val" }, top);
    var input = el("input", { type: "range", min: min, max: max, step: step, value: value }, wrap);
    function upd() { out.textContent = (suffix ? suffix(Number(input.value)) : input.value); onInput(Number(input.value)); }
    input.addEventListener("input", upd);
    upd();
    return input;
  }
  function toggles(parent, options, onPick, startIndex) {
    var row = el("div", { class: "fx-toggles", role: "group" }, parent);
    var btns = options.map(function (o, i) {
      var b = el("button", { type: "button", class: "fx-tog" }, row, o);
      b.addEventListener("click", function () { pick(i); });
      return b;
    });
    function pick(i) {
      btns.forEach(function (b, j) { b.setAttribute("aria-pressed", String(i === j)); });
      onPick(i);
    }
    pick(startIndex || 0);
    return row;
  }
  function frame(node, title, note) {
    node.innerHTML = "";
    var head = el("div", { class: "fx-head" }, node);
    el("span", { class: "fx-kicker" }, head, "Interactive");
    el("span", { class: "fx-title" }, head, title);
    var body = el("div", { class: "fx-body" }, node);
    if (note) el("p", { class: "fx-note" }, node, note);
    return body;
  }

  var FIGS = {};

  /* ---------- 1. Bond seesaw: why prices fall when yields rise ---------- */
  FIGS.seesaw = function (node) {
    var body = frame(node, "Why a bond sell-off means higher yields",
      "Illustrative bond: pays £4 a year for 10 years, then £100 back. Its payments never change, so when new bonds pay more, the only way an old one can compete is by getting cheaper.");
    var s = svg("svg", { viewBox: "0 62 400 112", class: "fx-svg", role: "img", "aria-label": "Seesaw between bond price and yield" }, body);
    svg("polygon", { points: "200,150 186,170 214,170", class: "fx-ink" }, s);
    var beam = svg("g", {}, s);
    svg("rect", { x: 40, y: 146, width: 320, height: 6, class: "fx-ink" }, beam);
    var left = svg("g", {}, beam), right = svg("g", {}, beam);
    svg("rect", { x: 50, y: 100, width: 90, height: 46, class: "fx-forest" }, left);
    var lt = svg("text", { x: 95, y: 128, class: "fx-svg-label fx-on-forest", "text-anchor": "middle" }, left);
    svg("rect", { x: 260, y: 100, width: 90, height: 46, class: "fx-paper2" }, right);
    var rt = svg("text", { x: 305, y: 128, class: "fx-svg-label", "text-anchor": "middle" }, right);
    svg("text", { x: 95, y: 92, class: "fx-svg-small", "text-anchor": "middle" }, left).textContent = "PRICE";
    svg("text", { x: 305, y: 92, class: "fx-svg-small", "text-anchor": "middle" }, right).textContent = "YIELD";
    var readout = el("p", { class: "fx-readout" }, body);
    slider(body, "Interest rate on new bonds", 2, 7, 0.05, 4, function (y) {
      var r = y / 100, price = 0;
      for (var t = 1; t <= 10; t++) price += 4 / Math.pow(1 + r, t);
      price += 100 / Math.pow(1 + r, 10);
      var angle = Math.max(-14, Math.min(14, (y - 4) * 4.5));
      beam.setAttribute("transform", "rotate(" + angle + " 200 150)");
      lt.textContent = "£" + fmt(price, 2);
      rt.textContent = fmt(y, 2) + "%";
      node._state = { price: price, y: y };
      readout.innerHTML = "At <strong>" + fmt(y, 2) + "%</strong>, this bond is worth <strong>£" + fmt(price, 2) + "</strong>" +
        (y > 4.01 ? " — less than the £100 it was issued at." : y < 3.99 ? " — more than its £100 face value." : ", exactly its face value.");
    }, function (v) { return fmt(v, 2) + "%"; });
  };

  /* ---------- 2. Mortgage what-if ---------- */
  FIGS.mortgage = function (node, cfg) {
    var body = frame(node, "What the rate rise does to a mortgage",
      "Repayment mortgage, standard monthly formula. Reference lines: " + (cfg.refs || []).map(function (r) { return r.label + " " + r.rate + "%"; }).join(" · ") + ".");
    var big = el("div", { class: "fx-big" }, body);
    var bars = el("div", { class: "fx-bars" }, body);
    var loan = 300000, rate = 5, years = 25;
    function pay(L, R, Y) { var r = R / 1200, n = Y * 12; return r === 0 ? L / n : L * r / (1 - Math.pow(1 + r, -n)); }
    function draw() {
      var m = pay(loan, rate, years);
      node._state = { loan: loan, rate: rate, years: years, pay: m };
      big.innerHTML = "<span class='fx-big-num'>£" + fmt(m) + "</span><span class='fx-big-unit'> a month</span>";
      bars.innerHTML = "";
      var rows = [{ label: "At 2% (2021-style)", rate: 2 }].concat(cfg.refs || []).concat([{ label: "Your setting", rate: rate, me: true }]);
      var max = Math.max.apply(null, rows.map(function (r) { return pay(loan, r.rate, years); }));
      rows.forEach(function (r) {
        var v = pay(loan, r.rate, years);
        var row = el("div", { class: "fx-bar-row" + (r.me ? " me" : "") }, bars);
        el("span", { class: "fx-bar-label" }, row, r.label + " · " + fmt(r.rate, 2) + "%");
        var track = el("span", { class: "fx-bar-track" }, row);
        el("span", { class: "fx-bar-fill", style: "width:" + (100 * v / max) + "%" }, track);
        el("span", { class: "fx-bar-val" }, row, "£" + fmt(v));
      });
    }
    slider(body, "Loan", 100000, 600000, 10000, loan, function (v) { loan = v; draw(); }, function (v) { return "£" + fmt(v); });
    slider(body, "Interest rate", 1, 9, 0.05, rate, function (v) { rate = v; draw(); }, function (v) { return fmt(v, 2) + "%"; });
    toggles(body, ["25 years", "30 years"], function (i) { years = i ? 30 : 25; draw(); });
  };

  /* ---------- 3. Hormuz flow ---------- */
  FIGS.hormuz = function (node, cfg) {
    var body = frame(node, "Ships through the Strait of Hormuz",
      "Schematic, not to scale. Ship counts from the reporting cited below; each dot stands for a share of the daily traffic.");
    var s = svg("svg", { viewBox: "0 0 400 200", class: "fx-svg", role: "img", "aria-label": "Schematic of tanker traffic through Hormuz" }, body);
    svg("path", { d: "M0,0 H400 V200 H0 Z", class: "fx-paper2" }, s);
    svg("path", { d: "M0,30 C80,20 150,40 205,85 C215,93 222,100 232,100 C250,100 270,120 300,140 C340,165 370,175 400,180 V200 H0 Z", class: "fx-land" }, s);
    svg("path", { d: "M0,0 H400 V120 C360,110 320,92 270,80 C250,76 238,74 230,72 C215,68 200,55 160,40 C110,22 60,12 0,10 Z", class: "fx-land" }, s);
    svg("path", { id: "hz-lane", d: "M10,24 C90,30 160,50 205,76 C220,85 240,88 265,100 C310,120 350,140 395,150", class: "fx-lane" }, s);
    svg("text", { x: 60, y: 60, class: "fx-svg-small" }, s).textContent = "THE GULF";
    svg("text", { x: 208, y: 112, class: "fx-svg-small" }, s).textContent = "HORMUZ";
    svg("text", { x: 270, y: 70, class: "fx-svg-small" }, s).textContent = "TO ASIA & EUROPE";
    var dots = svg("g", {}, s);
    var lane = s.querySelector("#hz-lane");
    var len = lane.getTotalLength ? lane.getTotalLength() : 420;
    var readout = el("p", { class: "fx-readout" }, body);
    var rate = 0, ships = [], last = 0, acc = 0;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    toggles(body, cfg.states.map(function (x) { return x.label; }), function (i) {
      var st = cfg.states[i];
      rate = st.perDay;
      readout.innerHTML = st.text;
      if (reduced) {
        dots.innerHTML = "";
        var n = Math.round(st.perDay / 4);
        for (var k = 0; k < n; k++) {
          var p = lane.getPointAtLength(len * (k + 0.5) / n);
          svg("circle", { cx: p.x, cy: p.y, r: 3, class: "fx-ship" }, dots);
        }
      }
    });
    if (reduced) return;
    function tick(t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      acc += dt * rate / 10;
      while (acc >= 1) { acc -= 1; ships.push({ d: 0, c: svg("circle", { r: 3, class: "fx-ship" }, dots) }); }
      ships = ships.filter(function (sh) {
        sh.d += dt * 70;
        if (sh.d > len) { sh.c.remove(); return false; }
        var p = lane.getPointAtLength(sh.d);
        sh.c.setAttribute("cx", p.x); sh.c.setAttribute("cy", p.y);
        return true;
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  /* ---------- 4. Predict first ---------- */
  FIGS.predict = function (node, cfg) {
    var body = frame(node, "Predict first", null);
    el("p", { class: "fx-q" }, body, cfg.question);
    var guess = (cfg.min + cfg.max) / 2;
    var u = function (v) { return (cfg.prefix || "") + fmt(v, cfg.dp || 0) + (cfg.unit || ""); };
    var input = slider(body, "Your guess", cfg.min, cfg.max, cfg.step, guess, function (v) { guess = v; }, u);
    var btn = el("button", { type: "button", class: "fx-btn" }, body, "Reveal");
    var track = el("div", { class: "fx-predict-track", hidden: "" }, body);
    var out = el("p", { class: "fx-readout", hidden: "" }, body);
    btn.addEventListener("click", function () {
      input.disabled = true; btn.disabled = true;
      track.hidden = false; out.hidden = false;
      var pos = function (v) { return (100 * (v - cfg.min) / (cfg.max - cfg.min)) + "%"; };
      track.innerHTML = "";
      el("span", { class: "fx-mark you", style: "left:" + pos(guess) }, track, "you");
      el("span", { class: "fx-mark real", style: "left:" + pos(cfg.answer) }, track, "real");
      var off = Math.abs(guess - cfg.answer), span = cfg.max - cfg.min;
      var verdict = off <= span * 0.05 ? "Spot on." : off <= span * 0.15 ? "Close." : "Further than most would guess.";
      out.innerHTML = "<strong>" + verdict + "</strong> The answer is <strong>" + u(cfg.answer) + "</strong>. " + cfg.explain;
      if (node._predicted) node._predicted(off <= span * 0.15);
    });
  };

  /* ---------- 5. Coalition builder ---------- */
  FIGS.seats = function (node, cfg) {
    var body = frame(node, cfg.title, cfg.note);
    var total = cfg.parties.reduce(function (a, p) { return a + p.seats; }, 0);
    var need = Math.floor(total / 2) + 1;
    var s = svg("svg", { viewBox: "0 0 400 215", class: "fx-svg", role: "img", "aria-label": "Parliament seats" }, body);
    var picked = {};
    var seatsEls = [];
    var rows = 5, idx = 0;
    var order = [];
    cfg.parties.forEach(function (p) { for (var i = 0; i < p.seats; i++) order.push(p); });
    var positions = [];
    for (var r = 0; r < rows; r++) {
      var radius = 90 + r * 20;
      var count = Math.round(total * radius / (rows * 110 + 40));
      positions.push({ radius: radius, count: count });
    }
    var sum = positions.reduce(function (a, p) { return a + p.count; }, 0);
    positions[rows - 1].count += total - sum;
    var pts = [];
    positions.forEach(function (row) {
      for (var i = 0; i < row.count; i++) {
        var a = Math.PI - Math.PI * (i + 0.5) / row.count;
        pts.push({ x: 200 + row.radius * Math.cos(a), y: 200 - row.radius * Math.sin(a), a: a });
      }
    });
    pts.sort(function (p, q) { return q.a - p.a; });
    pts.forEach(function (p, i) {
      var party = order[i];
      var c = svg("circle", { cx: p.x, cy: p.y, r: 6.5, fill: party.color, class: "fx-seat" }, s);
      seatsEls.push({ c: c, party: party });
    });
    var count = svg("text", { x: 200, y: 185, "text-anchor": "middle", class: "fx-svg-big" }, s);
    svg("text", { x: 200, y: 205, "text-anchor": "middle", class: "fx-svg-small" }, s).textContent = need + " NEEDED FOR A MAJORITY";
    var legend = el("div", { class: "fx-legend" }, body);
    var msg = el("p", { class: "fx-readout" }, body);
    function update() {
      var n = 0, hasBlocked = false;
      cfg.parties.forEach(function (p) { if (picked[p.name]) { n += p.seats; if (p.blocked) hasBlocked = true; } });
      seatsEls.forEach(function (s2) { s2.c.setAttribute("opacity", picked[s2.party.name] ? 1 : 0.22); });
      count.textContent = n + " / " + total;
      node._state = { seats: n, need: need, blocked: hasBlocked };
      if (node._autoCheck) node._autoCheck();
      msg.innerHTML = n === 0 ? "Tap parties to build a coalition." :
        hasBlocked ? "<strong>" + (n >= need ? "That's a majority on paper — " : "") + "but every other party has ruled out governing with the AfD</strong> (Germany's \"firewall\")." :
        n >= need ? "<strong>Majority.</strong> " + (cfg.win || "") : "Short by " + (need - n) + ".";
    }
    cfg.parties.forEach(function (p) {
      var b = el("button", { type: "button", class: "fx-party", "aria-pressed": "false" }, legend);
      el("span", { class: "fx-swatch", style: "background:" + p.color }, b);
      el("span", null, b, p.name + " · " + p.seats);
      if (!p.seats) { b.disabled = true; b.title = "No seats"; }
      b.addEventListener("click", function () { picked[p.name] = !picked[p.name]; b.setAttribute("aria-pressed", String(!!picked[p.name])); update(); });
    });
    update();
  };

  /* ---------- 6. Polls with margin of error ---------- */
  FIGS.polls = function (node, cfg) {
    var body = frame(node, cfg.title, cfg.note);
    var chart = el("div", { class: "fx-polls" }, body);
    toggles(body, cfg.polls.map(function (p) { return p.name; }), function (i) {
      var p = cfg.polls[i];
      chart.innerHTML = "";
      var lo = 30, hi = 60, pos = function (v) { return (100 * (v - lo) / (hi - lo)) + "%"; };
      p.rows.forEach(function (r) {
        var row = el("div", { class: "fx-poll-row" }, chart);
        el("span", { class: "fx-bar-label" }, row, r.name);
        var track = el("span", { class: "fx-poll-track" }, row);
        if (p.moe) el("span", { class: "fx-moe", style: "left:" + pos(r.v - p.moe) + ";width:calc(" + pos(r.v + p.moe) + " - " + pos(r.v - p.moe) + ")" }, track);
        el("span", { class: "fx-dot", style: "left:" + pos(r.v) + ";background:" + r.color }, track);
        el("span", { class: "fx-bar-val" }, row, r.v + "%");
      });
      var axis = el("div", { class: "fx-axis" }, chart);
      [30, 40, 50, 60].forEach(function (t) { el("span", { style: "left:" + pos(t) }, axis, t + "%"); });
      el("p", { class: "fx-readout" }, chart).innerHTML = p.text;
    });
  };

  /* ---------- 7. Holographic principle: surface vs volume ---------- */
  FIGS.holo = function (node) {
    var body = frame(node, "Why a surface can't hold as much as a volume — or can it?",
      "Count the little cubes inside a big cube, and the little squares on its surface. Ordinary intuition says the inside holds more information. The holographic principle says the true limit grows with the surface.");
    var s = svg("svg", { viewBox: "0 0 400 210", class: "fx-svg", role: "img", "aria-label": "Cube made of small cubes" }, body);
    var g = svg("g", {}, s);
    var readout = el("div", { class: "fx-twin" }, body);
    var vol = el("div", { class: "fx-stat" }, readout), surf = el("div", { class: "fx-stat" }, readout), ratio = el("div", { class: "fx-stat" }, readout);
    function iso(x, y, z, u) { return [125 + (x - y) * u * 0.87, 112 + (x + y) * u * 0.5 - z * u]; }
    slider(body, "Cube size (small cubes per side)", 1, 12, 1, 4, function (n) {
      g.innerHTML = "";
      var u = 95 / (n * 1.25 + 1);
      // three visible faces as grids
      function face(pts, cls) { svg("polygon", { points: pts.map(function (p) { return p.join(","); }).join(" "), class: cls }, g); }
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        // The three faces that point at the viewer: x = n, y = n and the top, z = n.
        face([iso(n, i, j, u), iso(n, i + 1, j, u), iso(n, i + 1, j + 1, u), iso(n, i, j + 1, u)], "fx-face-a");
        face([iso(i, n, j, u), iso(i + 1, n, j, u), iso(i + 1, n, j + 1, u), iso(i, n, j + 1, u)], "fx-face-b");
        face([iso(i, j, n, u), iso(i + 1, j, n, u), iso(i + 1, j + 1, n, u), iso(i, j + 1, n, u)], "fx-face-c");
      }
      // chart on the right: volume vs surface as n grows
      var cx = 260, cy = 190, w = 130, h = 160, maxN = 12;
      svg("line", { x1: cx, y1: cy, x2: cx + w, y2: cy, class: "fx-axis-line" }, g);
      svg("line", { x1: cx, y1: cy, x2: cx, y2: cy - h, class: "fx-axis-line" }, g);
      var maxV = Math.pow(maxN, 3);
      function path(f) { var d = ""; for (var k = 1; k <= maxN; k++) { var x = cx + w * k / maxN, y = cy - h * Math.min(1, f(k) / maxV); d += (k === 1 ? "M" : "L") + x + "," + y; } return d; }
      svg("path", { d: path(function (k) { return k * k * k; }), class: "fx-line-vol" }, g);
      svg("path", { d: path(function (k) { return 6 * k * k; }), class: "fx-line-surf" }, g);
      svg("line", { x1: cx + w * n / maxN, y1: cy, x2: cx + w * n / maxN, y2: cy - h, class: "fx-cursor" }, g);
      svg("text", { x: cx + 4, y: cy - h + 10, class: "fx-svg-small" }, g).textContent = "INSIDE (n³)";
      svg("text", { x: cx + 4, y: cy - h + 24, class: "fx-svg-small fx-surf-label" }, g).textContent = "SURFACE (6n²)";
      node._state = { n: n };
      vol.innerHTML = "<span class='fx-stat-num'>" + fmt(n * n * n) + "</span><span class='fx-stat-label'>cubes inside</span>";
      surf.innerHTML = "<span class='fx-stat-num'>" + fmt(6 * n * n) + "</span><span class='fx-stat-label'>squares on the surface</span>";
      ratio.innerHTML = "<span class='fx-stat-num'>" + fmt(n * n * n / (6 * n * n), 2) + "×</span><span class='fx-stat-label'>inside ÷ surface</span>";
    });
  };

  /* ---------- 8. Tug of war inside the Earth ---------- */
  FIGS.tug = function (node) {
    var body = frame(node, "The tug-of-war that changes the length of a day",
      "Illustrative. The study found gravity between the inner core and mantle slightly outweighs the magnetic and frictional forces; the net effect changes a day's length by a few milliseconds over decades.");
    var s = svg("svg", { viewBox: "0 0 400 120", class: "fx-svg", role: "img", "aria-label": "Tug of war" }, body);
    svg("line", { x1: 20, y1: 60, x2: 380, y2: 60, class: "fx-rope" }, s);
    svg("line", { x1: 200, y1: 30, x2: 200, y2: 90, class: "fx-axis-line" }, s);
    var knot = svg("circle", { cx: 200, cy: 60, r: 9, class: "fx-forest" }, s);
    svg("text", { x: 20, y: 100, class: "fx-svg-small" }, s).textContent = "GRAVITY (CORE ↔ MANTLE)";
    svg("text", { x: 380, y: 100, class: "fx-svg-small", "text-anchor": "end" }, s).textContent = "MAGNETIC + FRICTION";
    var readout = el("p", { class: "fx-readout" }, body);
    var gpull = 55, other = 45;
    function draw() {
      var net = gpull - other;
      node._state = { net: net };
      knot.setAttribute("cx", 200 - net * 3);
      readout.innerHTML = Math.abs(net) < 3 ? "<strong>Balanced.</strong> Small swings either way — roughly what the record shows." :
        net > 0 ? "<strong>Gravity wins.</strong> This is the study's best fit: gravity dominant, but held in check." :
        "<strong>The other forces win.</strong> The model that fits the data didn't look like this.";
    }
    slider(body, "Gravity's pull", 0, 100, 1, gpull, function (v) { gpull = v; draw(); });
    slider(body, "Magnetic + frictional pull", 0, 100, 1, other, function (v) { other = v; draw(); });
  };

  /* ---------- 9. Timeline ---------- */
  FIGS.timeline = function (node, cfg) {
    var body = frame(node, cfg.title, null);
    var line = el("div", { class: "fx-tl" }, body);
    var detail = el("div", { class: "fx-tl-detail", "aria-live": "polite" }, body);
    var t0 = Date.parse(cfg.events[0].date), t1 = Date.parse(cfg.events[cfg.events.length - 1].date);
    var btns = cfg.events.map(function (e, i) {
      var b = el("button", { type: "button", class: "fx-tl-dot", style: "left:" + (4 + 92 * (Date.parse(e.date) - t0) / (t1 - t0)) + "%", "aria-label": e.label }, line);
      b.addEventListener("click", function () { show(i); });
      return b;
    });
    var nav = el("div", { class: "fx-tl-nav" }, body);
    var prev = el("button", { type: "button", class: "fx-btn ghost" }, nav, "← Earlier");
    var next = el("button", { type: "button", class: "fx-btn ghost" }, nav, "Later →");
    var cur = 0;
    function show(i) {
      cur = Math.max(0, Math.min(cfg.events.length - 1, i));
      btns.forEach(function (b, j) { b.setAttribute("aria-pressed", String(j === cur)); });
      var e = cfg.events[cur];
      detail.innerHTML = "<span class='fx-tl-date'>" + e.label + "</span><span class='fx-tl-text'>" + e.text + "</span>";
    }
    prev.addEventListener("click", function () { show(cur - 1); });
    next.addEventListener("click", function () { show(cur + 1); });
    show(cfg.events.length - 1);
  };

  /* ---------- glossary pop-ups ---------- */
  function glossary() {
    var tip = el("div", { class: "fx-tip", role: "tooltip", hidden: "" }, document.body);
    var openFor = null;
    function place(t) {
      var r = t.getBoundingClientRect();
      tip.style.left = Math.max(12, Math.min(window.innerWidth - 292, r.left + window.scrollX)) + "px";
      tip.style.top = (r.bottom + window.scrollY + 8) + "px";
    }
    document.querySelectorAll("dfn[data-def]").forEach(function (t) {
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      function open() { tip.innerHTML = "<strong>" + t.textContent + "</strong> " + t.getAttribute("data-def"); tip.hidden = false; place(t); openFor = t; }
      t.addEventListener("click", function (ev) { ev.stopPropagation(); if (openFor === t && !tip.hidden) { tip.hidden = true; openFor = null; } else open(); });
      t.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); } if (ev.key === "Escape") tip.hidden = true; });
    });
    document.addEventListener("click", function () { tip.hidden = true; openFor = null; });
    window.addEventListener("resize", function () { if (openFor && !tip.hidden) place(openFor); });
  }

  /* ---------- problems: one per figure ---------- */
  var solvedCount = 0, problemCount = 0, badge = null;
  function updateBadge() {
    if (!badge) {
      badge = el("div", { class: "fx-badge", role: "status", "aria-live": "polite" }, document.body);
    }
    badge.innerHTML = "<span>Problems solved</span><strong>" + solvedCount + " / " + problemCount + "</strong>";
  }
  var CHECKS = {
    // Each returns true when the figure's state answers its problem.
    priceBetween: function (st, p) { return st && st.price >= p.lo && st.price <= p.hi; },
    maxLoan: function (st, p) { return st && st.years === p.years && st.rate >= p.rateLo && st.rate <= p.rateHi && st.pay <= p.budget && st.loan >= p.minLoan; },
    majorityWithout: function (st) { return st && st.seats >= st.need && !st.blocked; },
    cubeSize: function (st, p) { return st && st.n === p.n; },
    netBetween: function (st, p) { return st && st.net >= p.lo && st.net <= p.hi; }
  };
  function problem(node, p) {
    problemCount++;
    var box = el("div", { class: "fx-problem" });
    var head = node.querySelector(".fx-head");
    if (head && head.nextSibling) node.insertBefore(box, head.nextSibling); else node.insertBefore(box, node.firstChild);
    var top = el("div", { class: "fx-problem-top" }, box);
    el("span", { class: "fx-problem-label" }, top, "Problem");
    var status = el("span", { class: "fx-status" }, top, "Unsolved");
    if (p.type !== "predict") el("p", { class: "fx-problem-text" }, box, p.text);
    var controls = el("div", { class: "fx-problem-controls" }, box);
    var feedback = el("p", { class: "fx-feedback", hidden: "" }, box);
    var done = false;
    function solve() {
      if (done) return;
      done = true; solvedCount++; updateBadge();
      status.textContent = "Solved ✓"; status.classList.add("ok"); box.classList.add("solved");
      feedback.hidden = false; feedback.innerHTML = "<strong>Solved.</strong> " + p.why;
      controls.querySelectorAll("button").forEach(function (b) { if (!b.classList.contains("fx-opt-pick")) b.disabled = true; });
    }
    function miss(msg) { if (done) return; feedback.hidden = false; feedback.innerHTML = msg || "Not yet. Keep exploring the figure."; }
    if (p.type === "choice") {
      p.options.forEach(function (o, i) {
        var b = el("button", { type: "button", class: "fx-opt-pick" }, controls, o);
        b.addEventListener("click", function () {
          if (done) return;
          if (i === p.answer) { b.classList.add("right"); solve(); } else { b.classList.add("wrong"); miss("Not quite. Use the figure, then try again."); }
        });
      });
    } else if (p.type === "predict") {
      node._predicted = function (close) { if (close) solve(); else { done = true; status.textContent = "Answered"; feedback.hidden = false; feedback.innerHTML = "Not close this time. The reveal above shows why."; } };
      el("span", { class: "fx-problem-hint-inline" }, controls, "Make your guess in the figure, then press Reveal. Within 15% counts as solved.");
    } else {
      var check = function () { return CHECKS[p.check] && CHECKS[p.check](node._state, p); };
      var btn = el("button", { type: "button", class: "fx-btn" }, controls, "Check my answer");
      btn.addEventListener("click", function () { if (check()) solve(); else miss(p.miss); });
      if (p.auto) node._autoCheck = function () { if (check()) solve(); };
    }
    if (p.hint) {
      var h = el("button", { type: "button", class: "fx-btn ghost" }, controls, "Hint");
      h.addEventListener("click", function () { if (!done) { feedback.hidden = false; feedback.innerHTML = "<strong>Hint:</strong> " + p.hint; } });
    }
    updateBadge();
  }

  /* ---------- people cards ---------- */
  function people() {
    var data = {};
    var src = document.getElementById("people");
    if (src) { try { data = JSON.parse(src.textContent); } catch (e) { data = {}; } }
    var card = el("div", { class: "fx-who", role: "dialog", hidden: "" }, document.body);
    var openFor = null;
    function show(t) {
      var d = data[t.getAttribute("data-who")]; if (!d) return;
      card.innerHTML = (d.img ? "<img src='" + d.img + "' alt='' loading='lazy'>" : "") +
        "<div><strong>" + d.name + "</strong><span class='fx-who-role'>" + (d.role || "") + "</span><p>" + d.bio + "</p>" +
        (d.url ? "<a href='" + d.url + "' target='_blank' rel='noopener'>Wikipedia ↗</a>" : "") + "</div>";
      card.hidden = false; openFor = t;
      var r = t.getBoundingClientRect();
      card.style.left = Math.max(12, Math.min(window.innerWidth - 332, r.left + window.scrollX)) + "px";
      card.style.top = (r.bottom + window.scrollY + 8) + "px";
    }
    function hide() { card.hidden = true; openFor = null; }
    // Mouse: show only while the pointer is on the name and hide the moment
    // it leaves; the card never takes the pointer (CSS .passive), so it can't
    // block text. Touch: tap a name to show, tap anywhere else to close.
    document.querySelectorAll(".who[data-who]").forEach(function (t) {
      var d = data[t.getAttribute("data-who")];
      if (!d) return;
      t.setAttribute("tabindex", "0");
      t.addEventListener("pointerenter", function (ev) { if (ev.pointerType === "mouse") { card.classList.add("passive"); show(t); } });
      t.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") hide(); });
      t.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (card.classList.contains("passive") && openFor === t) { hide(); if (d.url) window.open(d.url, "_blank", "noopener"); return; }
        card.classList.remove("passive");
        if (openFor === t && !card.hidden) hide(); else show(t);
      });
      t.addEventListener("keydown", function (ev) { if (ev.key === "Enter") show(t); if (ev.key === "Escape") hide(); });
      t.addEventListener("blur", function () { if (card.classList.contains("passive")) hide(); });
    });
    card.addEventListener("click", function (ev) { ev.stopPropagation(); });
    document.addEventListener("click", hide);
    window.addEventListener("scroll", function () { if (card.classList.contains("passive")) hide(); }, { passive: true });
  }

  function init() {
    document.querySelectorAll(".fig[data-fig]").forEach(function (node) {
      var f = FIGS[node.getAttribute("data-fig")];
      if (!f) return;
      var cfg = {};
      try { cfg = JSON.parse(node.getAttribute("data-config") || "{}"); } catch (e) { cfg = {}; }
      try { f(node, cfg); if (cfg.problem) problem(node, cfg.problem); } catch (e) { node.innerHTML = "<p class='fx-note'>This figure couldn't load.</p>"; if (window.console) console.error(e); }
    });
    glossary();
    people();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
