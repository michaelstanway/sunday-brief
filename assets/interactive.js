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
  /* ---------- 9. Downlink budget: what compression buys a satellite ---------- */
  FIGS.downlink = function (node, cfg) {
    var body = frame(node, cfg.title || "Can the satellite get its pictures down?", cfg.note);
    var big = el("div", { class: "fx-big" }, body);
    var bars = el("div", { class: "fx-bars" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    var ratio = 1, passes = cfg.passes || 4;
    var mbps = cfg.mbps, mins = cfg.minutes, imaged = cfg.imagedGB;
    function draw() {
      // Gigabytes the link can carry a day: Mbit/s × seconds ÷ 8000.
      var link = mbps * mins * 60 * passes / 8000;
      var need = imaged / ratio;
      var share = Math.min(1, link / need);
      node._state = { ratio: ratio, passes: passes, link: link, need: need, share: share };
      big.innerHTML = "<span class='fx-big-num'>" + fmt(100 * share) + "%</span><span class='fx-big-unit'> of each day's imagery reaches the ground</span>";
      bars.innerHTML = "";
      var max = Math.max(link, imaged);
      [{ label: "Imaged a day (raw)", v: imaged }, { label: "To send after compression", v: need }, { label: "Link capacity a day", v: link, me: true }].forEach(function (r) {
        var row = el("div", { class: "fx-bar-row" + (r.me ? " me" : "") }, bars);
        el("span", { class: "fx-bar-label" }, row, r.label);
        var track = el("span", { class: "fx-bar-track" }, row);
        el("span", { class: "fx-bar-fill", style: "width:" + (100 * r.v / max) + "%" }, track);
        el("span", { class: "fx-bar-val" }, row, fmt(r.v) + " GB");
      });
      out.innerHTML = share >= 1 ? "<strong>Everything gets down.</strong> Spare capacity: " + fmt(link - need) + " GB a day." : "<strong>" + fmt(need - link) + " GB a day stays on board</strong> or is never taken.";
      if (node._autoCheck) node._autoCheck();
    }
    slider(body, "Compression ratio", 1, 20, 0.5, ratio, function (v) { ratio = v; draw(); }, function (v) { return fmt(v, 1) + " : 1"; });
    slider(body, "Ground-station passes a day", 1, 16, 1, passes, function (v) { passes = v; draw(); }, function (v) { return fmt(v); });
  };

  /* ---------- 10. Graham's rearrangement: make every running total different ---------- */
  FIGS.rearrange = function (node, cfg) {
    var p = cfg.p, order = cfg.start.slice();
    var body = frame(node, cfg.title || "Reorder the numbers so no running total repeats", cfg.note);
    var row = el("div", { class: "fx-toggles", role: "group" }, body);
    var s = svg("svg", { viewBox: "0 0 400 190", class: "fx-svg", role: "img", "aria-label": "Clock of remainders modulo " + p }, body);
    var out = el("p", { class: "fx-readout" }, body);
    var picked = -1;
    function pos(r, rad) { var a = -Math.PI / 2 + 2 * Math.PI * r / p; return [200 + rad * Math.cos(a), 95 + rad * Math.sin(a)]; }
    function draw() {
      row.innerHTML = "";
      order.forEach(function (v, i) {
        var b = el("button", { type: "button", class: "fx-tog", "aria-pressed": String(i === picked) }, row, String(v));
        b.addEventListener("click", function () {
          if (picked < 0) picked = i;
          else { var t = order[picked]; order[picked] = order[i]; order[i] = t; picked = -1; }
          draw();
        });
      });
      s.innerHTML = "";
      var sums = [], tot = 0, hits = {};
      order.forEach(function (v) { tot = (tot + v) % p; sums.push(tot); hits[tot] = (hits[tot] || 0) + 1; });
      for (var r = 0; r < p; r++) {
        var c = pos(r, 72), bad = hits[r] > 1;
        svg("circle", { cx: c[0], cy: c[1], r: 13, style: "fill:" + (bad ? "var(--bad-soft)" : hits[r] ? "var(--moss)" : "var(--paper-2)") + ";stroke:" + (bad ? "var(--bad)" : "var(--hair)") }, s);
        var t = svg("text", { x: c[0], y: c[1] + 4, "text-anchor": "middle", class: "fx-svg-small" }, s); t.textContent = String(r);
      }
      var d = "";
      sums.forEach(function (r, i) { var c = pos(r, 56); d += (i ? "L" : "M") + c[0] + "," + c[1]; });
      svg("path", { d: d, style: "fill:none;stroke:var(--forest);stroke-width:2" }, s);
      var dup = sums.filter(function (r) { return hits[r] > 1; });
      var valid = dup.length === 0;
      node._state = { valid: valid, order: order.slice() };
      out.innerHTML = "Running totals (mod " + p + "): <strong>" + sums.join(" → ") + "</strong>. " +
        (valid ? "<strong>All different.</strong> A valid ordering." : "<strong>" + dup[0] + " repeats.</strong> Tap two numbers to swap them.");
      if (node._autoCheck) node._autoCheck();
    }
    draw();
  };

  /* ---------- 11. A unique game: label the nodes to satisfy edge rules mod k ---------- */
  FIGS.uniquegame = function (node, cfg) {
    var k = cfg.k, n = cfg.nodes, edges = cfg.edges, lab = [];
    for (var i = 0; i < n; i++) lab.push(0);
    var body = frame(node, cfg.title || "Label the dots to satisfy the rules", cfg.note);
    var s = svg("svg", { viewBox: "0 0 400 220", class: "fx-svg", role: "img", "aria-label": "A small unique game with " + n + " dots" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    var reset = el("button", { type: "button", class: "fx-btn ghost" }, body, "Set all to 0");
    function pos(i) { var a = -Math.PI / 2 + 2 * Math.PI * i / n; return [200 + 120 * Math.cos(a), 110 + 88 * Math.sin(a)]; }
    function ok(e) { return ((lab[e[1]] - lab[e[0]] - e[2]) % k + k) % k === 0; }
    function draw() {
      s.innerHTML = "";
      var sat = 0;
      edges.forEach(function (e) {
        var a = pos(e[0]), b = pos(e[1]), good = ok(e);
        if (good) sat++;
        svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: "stroke:" + (good ? "var(--forest)" : "var(--bad)") + ";stroke-width:" + (good ? 2 : 3) + (good ? "" : ";stroke-dasharray:6 4") }, s);
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        svg("rect", { x: mx - 15, y: my - 10, width: 30, height: 18, rx: 4, style: "fill:var(--paper);stroke:var(--hair)" }, s);
        var t = svg("text", { x: mx, y: my + 3, "text-anchor": "middle", class: "fx-svg-small" }, s);
        t.textContent = "+" + e[2];
      });
      lab.forEach(function (v, i) {
        var c = pos(i);
        var g = svg("g", { tabindex: "0", role: "button", "aria-label": "Dot " + String.fromCharCode(65 + i) + ", label " + v, style: "cursor:pointer" }, s);
        svg("circle", { cx: c[0], cy: c[1], r: 17, style: "fill:var(--paper-2);stroke:var(--ink);stroke-width:1.5" }, g);
        var t = svg("text", { x: c[0], y: c[1] + 5, "text-anchor": "middle", class: "fx-svg-label" }, g);
        t.textContent = String(v);
        var nm = svg("text", { x: c[0] + 22, y: c[1] - 14, class: "fx-svg-small" }, g);
        nm.textContent = String.fromCharCode(65 + i);
        function bump() { lab[i] = (lab[i] + 1) % k; draw(); }
        g.addEventListener("click", bump);
        g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); bump(); } });
      });
      node._state = { sat: sat, total: edges.length, labels: lab.slice() };
      out.innerHTML = "<strong>" + sat + " of " + edges.length + " rules satisfied.</strong> A rule \"+c\" on the line from X to Y means Y = X + c, counting mod " + k + ". Tap a dot to change its label.";
      if (node._autoCheck) node._autoCheck();
    }
    reset.addEventListener("click", function () { for (var i = 0; i < n; i++) lab[i] = 0; draw(); });
    draw();
  };

  /* ---------- 12. Weighing a galaxy by how fast its stars move ---------- */
  FIGS.darkspeed = function (node, cfg) {
    var body = frame(node, cfg.title || "How much dark matter fits the measured speed?", cfg.note);
    var big = el("div", { class: "fx-big" }, body);
    var bars = el("div", { class: "fx-bars" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    var ratio = 0, lo = cfg.measured - cfg.minus, hi = cfg.measured + cfg.plus;
    function draw() {
      // Speed grows with the square root of the mass inside the galaxy.
      var sigma = cfg.starsOnly * Math.sqrt(1 + ratio);
      var inside = sigma >= lo && sigma <= hi;
      node._state = { ratio: ratio, sigma: sigma, inside: inside };
      big.innerHTML = "<span class='fx-big-num'>" + fmt(sigma, 1) + "</span><span class='fx-big-unit'> km/s predicted star speed</span>";
      bars.innerHTML = "";
      var max = Math.max(cfg.halo, sigma) * 1.05;
      [{ label: "Measured (upper error)", v: hi }, { label: "Measured", v: cfg.measured }, { label: "Stars only", v: cfg.starsOnly }, { label: "Normal dark-matter halo", v: cfg.halo }, { label: "Your galaxy", v: sigma, me: true }].forEach(function (r) {
        var row = el("div", { class: "fx-bar-row" + (r.me ? " me" : "") }, bars);
        el("span", { class: "fx-bar-label" }, row, r.label);
        var track = el("span", { class: "fx-bar-track" }, row);
        el("span", { class: "fx-bar-fill", style: "width:" + (100 * r.v / max) + "%" }, track);
        el("span", { class: "fx-bar-val" }, row, fmt(r.v, 1) + " km/s");
      });
      out.innerHTML = inside ? "<strong>Fits the measurement.</strong> It lies between " + fmt(lo, 1) + " and " + fmt(hi, 1) + " km/s." : "<strong>Too fast.</strong> The stars would move faster than the measurement allows.";
      if (node._autoCheck) node._autoCheck();
    }
    slider(body, "Dark matter for each unit of star mass", 0, cfg.max || 10, 0.1, 0, function (v) { ratio = v; draw(); }, function (v) { return fmt(v, 1) + " : 1"; });
  };

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

  /* ---------- 14. Zero-free strip: how far from the edge the zeta zeros must stay ---------- */
  FIGS.zerostrip = function (node, cfg) {
    var body = frame(node, cfg.title || "How a zero-free strip tightens the prime count", cfg.note);
    var s = svg("svg", { viewBox: "0 0 400 120", class: "fx-svg", role: "img", "aria-label": "The critical strip, with the region where zeta zeros may lie" }, body);
    var X = function (re) { return 40 + 320 * re; };
    svg("rect", { x: X(0), y: 20, width: 320, height: 60, class: "fx-paper2" }, s);
    var free1 = svg("rect", { x: X(1), y: 20, width: 0, height: 60, class: "fx-forest" }, s);
    var free0 = svg("rect", { x: X(0), y: 20, width: 0, height: 60, class: "fx-forest" }, s);
    svg("rect", { x: X(0.5) - 1, y: 20, width: 2, height: 60, class: "fx-ink" }, s);
    [[0, "0"], [0.5, "1/2"], [1, "1"]].forEach(function (t) {
      svg("text", { x: X(t[0]), y: 98, class: "fx-svg-small", "text-anchor": "middle" }, s).textContent = t[1];
    });
    svg("text", { x: 200, y: 114, class: "fx-svg-small", "text-anchor": "middle" }, s).textContent = "REAL PART OF s";
    var lab = svg("text", { x: 200, y: 14, class: "fx-svg-small", "text-anchor": "middle" }, s);
    var big = el("div", { class: "fx-big" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    var opt = cfg.options[0], k = cfg.start || 12;
    function draw() {
      var sg = opt.sigma, w = 320 * (1 - sg);
      free1.setAttribute("x", X(sg)); free1.setAttribute("width", w); free0.setAttribute("width", w);
      lab.textContent = sg >= 1 ? "NO FIXED ZERO-FREE STRIP" : "GREEN: NO ZEROS ALLOWED (WIDTH " + fmt(1 - sg, 3) + " EACH SIDE)";
      var rel = sg >= 1 ? null : Math.pow(10, k * (sg - 1));
      node._state = { sigma: sg, k: k, rel: rel === null ? 1 : rel };
      if (rel === null) {
        big.innerHTML = "<span class='fx-big-num'>?</span><span class='fx-big-unit'> no power-saving guarantee</span>";
        out.innerHTML = "<strong>No fixed strip.</strong> The known zero-free regions shrink toward the line 1, so the error in counting primes up to 10<sup>" + k + "</sup> shrinks more slowly than any power of x.";
      } else {
        big.innerHTML = "<span class='fx-big-num'>" + (rel >= 0.001 ? fmt(100 * rel, rel >= 0.1 ? 0 : 2) + "%" : "10<sup>" + fmt(k * (sg - 1) + 2, 1) + "</sup>%") + "</span><span class='fx-big-unit'> error bound, as a share of the count</span>";
        out.innerHTML = "Counting primes up to <strong>10<sup>" + k + "</sup></strong>: the error is at most about x<sup>" + opt.text + "</sup> = 10<sup>" + fmt(k * sg, 1) + "</sup>, out of roughly x = 10<sup>" + k + "</sup>.";
      }
      if (node._autoCheck) node._autoCheck();
    }
    toggles(body, cfg.options.map(function (o) { return o.label; }), function (i) { opt = cfg.options[i]; draw(); });
    slider(body, "Count primes up to x = 10^k", cfg.min || 4, cfg.max || 30, 1, k, function (v) { k = v; draw(); }, function (v) { return "k = " + fmt(v); });
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
    var hoverDev = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);
    document.querySelectorAll("dfn[data-def]").forEach(function (t) {
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      function open() { tip.innerHTML = "<strong>" + t.textContent + "</strong> " + t.getAttribute("data-def"); tip.hidden = false; place(t); openFor = t; }
      t.addEventListener("click", function (ev) { ev.stopPropagation(); if (!hoverDev && openFor === t && !tip.hidden) { tip.hidden = true; openFor = null; } else open(); });
      t.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); } if (ev.key === "Escape") tip.hidden = true; });
      if (hoverDev) {
        t.addEventListener("mouseenter", open);
        t.addEventListener("mouseleave", function () { if (openFor === t) { tip.hidden = true; openFor = null; } });
      }
    });
    document.addEventListener("click", function () { tip.hidden = true; openFor = null; });
    window.addEventListener("resize", function () { if (openFor && !tip.hidden) place(openFor); });
  }

  /* ---------- 25 Oct 2026 (v2) figures ---------- */
  // Small line chart: series = [{pts:[[x,y]...], cls}], refs = [{y, label}]
  function lineChart(parent, opt) {
    var W = 400, H = 210, L = 44, Rm = 12, T = 12, B = 30;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "fx-svg", role: "img", "aria-label": opt.label || "Chart" }, parent);
    var X = function (x) { return L + (W - L - Rm) * (x - opt.x0) / (opt.x1 - opt.x0); };
    var Y = function (y) { return T + (H - T - B) * (1 - (y - opt.y0) / (opt.y1 - opt.y0)); };
    svg("line", { x1: L, y1: H - B, x2: W - Rm, y2: H - B, class: "fx-axis-line" }, s);
    svg("line", { x1: L, y1: T, x2: L, y2: H - B, class: "fx-axis-line" }, s);
    (opt.yticks || []).forEach(function (t) { var tx = svg("text", { x: L - 6, y: Y(t) + 3, "text-anchor": "end", class: "fx-svg-small" }, s); tx.textContent = (opt.yfmt ? opt.yfmt(t) : t); });
    (opt.xticks || []).forEach(function (t) { var tx = svg("text", { x: X(t), y: H - B + 14, "text-anchor": "middle", class: "fx-svg-small" }, s); tx.textContent = (opt.xfmt ? opt.xfmt(t) : t); });
    if (opt.xlabel) { var xl = svg("text", { x: W - Rm, y: H - 3, "text-anchor": "end", class: "fx-svg-small" }, s); xl.textContent = opt.xlabel; }
    var g = svg("g", null, s);
    return {
      draw: function (series, refs) {
        while (g.firstChild) g.removeChild(g.firstChild);
        (refs || []).forEach(function (r) {
          svg("line", { x1: L, x2: W - Rm, y1: Y(r.y), y2: Y(r.y), class: "fx-cursor" }, g);
          var t = svg("text", { x: W - Rm - 2, y: Y(r.y) - 4, "text-anchor": "end", class: "fx-svg-small" }, g); t.textContent = r.label;
        });
        series.forEach(function (se) {
          var d = se.pts.map(function (p, i) { var y = Math.max(opt.y0, Math.min(opt.y1, p[1])); return (i ? "L" : "M") + X(p[0]).toFixed(1) + "," + Y(y).toFixed(1); }).join("");
          svg("path", { d: d, class: se.cls || "fx-line-vol" }, g);
          if (se.label) { var last = se.pts[se.pts.length - 1]; var t = svg("text", { x: X(last[0]) - 2, y: Y(Math.max(opt.y0, Math.min(opt.y1, last[1]))) - 6, "text-anchor": "end", class: "fx-svg-small" + (se.cls === "fx-line-surf" ? " fx-surf-label" : "") }, g); t.textContent = se.label; }
        });
      }
    };
  }
  function bars(parent, rows, max, fmtv) {
    parent.innerHTML = "";
    rows.forEach(function (r) {
      var row = el("div", { class: "fx-bar-row" + (r.me ? " me" : "") }, parent);
      el("span", { class: "fx-bar-label" }, row, r.label);
      var track = el("span", { class: "fx-bar-track" }, row);
      el("span", { class: "fx-bar-fill", style: "width:" + Math.max(0, Math.min(100, 100 * r.v / max)) + "%" }, track);
      el("span", { class: "fx-bar-val" }, row, fmtv(r.v));
    });
  }

  /* Debt snowball: debt ratio next year = debt × (1 + r) / (1 + g) − primary balance */
  FIGS.snowball = function (node, cfg) {
    var body = frame(node, cfg.title || "When does debt stop growing on its own?", cfg.note);
    var d0 = cfg.debt || 119, r = cfg.r || 3, g = cfg.g || 3, pb = cfg.pb != null ? cfg.pb : -2;
    var big = el("div", { class: "fx-big" }, body);
    var chart = lineChart(body, { x0: 0, x1: 10, y0: cfg.y0 || 80, y1: cfg.y1 || 180, yticks: [100, 120, 140, 160], xticks: [0, 5, 10], xfmt: function (t) { return "year " + t; }, yfmt: function (t) { return t + "%"; }, label: "Debt as a share of GDP over ten years" });
    var out = el("p", { class: "fx-readout" }, body);
    function draw() {
      var d = d0, pts = [[0, d]];
      for (var t = 1; t <= 10; t++) { d = d * (1 + r / 100) / (1 + g / 100) - pb; pts.push([t, d]); }
      var need = d0 * (r - g) / (100 + g);
      node._state = { r: r, g: g, pb: pb, d0: d0, d10: d, need: need };
      big.innerHTML = "<span class='fx-big-num'>" + fmt(d, 0) + "%</span><span class='fx-big-unit'> of GDP after ten years (starts at " + fmt(d0, 0) + "%)</span>";
      chart.draw([{ pts: pts, cls: "fx-line-surf", label: "debt" }], [{ y: d0, label: "today " + fmt(d0, 0) + "%" }]);
      out.innerHTML = "To hold debt flat at these rates the budget needs a primary balance of <strong>" + (need >= 0 ? "+" : "") + fmt(need, 1) + "% of GDP</strong>. " +
        (r > g ? "Interest above growth makes the pile grow by itself." : "Growth at or above interest shrinks the ratio by itself.");
      if (node._autoCheck) node._autoCheck();
    }
    slider(body, "Average interest rate on the debt", 1, 6, 0.1, r, function (v) { r = v; draw(); }, function (v) { return fmt(v, 1) + "%"; });
    slider(body, "Nominal growth (real growth + inflation)", 0, 6, 0.1, g, function (v) { g = v; draw(); }, function (v) { return fmt(v, 1) + "%"; });
    slider(body, "Primary balance (budget before interest), % of GDP", -5, 3, 0.1, pb, function (v) { pb = v; draw(); }, function (v) { return (v > 0 ? "+" : "") + fmt(v, 1) + "%"; });
  };

  /* Patrons: a two-sided war of attrition with outside supply */
  FIGS.patrons = function (node, cfg) {
    var body = frame(node, cfg.title || "Why outside backers keep a war going", cfg.note);
    var A = cfg.a || "Army", B = cfg.b || "RSF", pa = cfg.pa != null ? cfg.pa : 6, pr = cfg.pr != null ? cfg.pr : 6;
    var own = 2, k = 0.05, floor = 40, max = cfg.max || 6;
    var big = el("div", { class: "fx-big" }, body);
    var chart = lineChart(body, { x0: 0, x1: 60, y0: 0, y1: 200, yticks: [0, 40, 100, 160], xticks: [0, 12, 24, 36, 48, 60], xfmt: function (t) { return t + "m"; }, label: "Fighting strength of each side by month" });
    var out = el("p", { class: "fx-readout" }, body);
    function draw() {
      var a = 100, b = 100, pa1 = [[0, a]], pb1 = [[0, b]], end = null, loser = null, harm = 0;
      for (var m = 1; m <= 60; m++) {
        harm += k * (a + b);
        var na = a + own + pa - k * b, nb = b + own + pr - k * a; a = na; b = nb;
        pa1.push([m, a]); pb1.push([m, b]);
        if (!end && (a < floor || b < floor)) { end = m; loser = a < b ? A : B; break; }
      }
      node._state = { pa: pa, pr: pr, months: end || 999, loser: loser, harm: harm };
      big.innerHTML = end ? "<span class='fx-big-num'>" + end + " months</span><span class='fx-big-unit'> until the " + loser + " must seek talks</span>"
        : "<span class='fx-big-num'>No end</span><span class='fx-big-unit'> in five years: neither side runs short</span>";
      chart.draw([{ pts: pa1, cls: "fx-line-surf", label: A }, { pts: pb1, cls: "fx-line-vol", label: B }], [{ y: floor, label: "too weak to fight on" }]);
      out.innerHTML = "Losses inflicted per month at the end: <strong>" + fmt(k * (a + b), 1) + "</strong> units (more supply means harder fighting, not a faster end).";
      if (node._autoCheck) node._autoCheck();
    }
    slider(body, "Outside supply to the " + A + " (units a month)", 0, max, 1, pa, function (v) { pa = v; draw(); });
    slider(body, "Outside supply to the " + B + " (units a month)", 0, max, 1, pr, function (v) { pr = v; draw(); });
  };

  /* Flywheel: launch cost per flight = fixed costs / launches + hardware thrown away */
  FIGS.flywheel = function (node, cfg) {
    var body = frame(node, cfg.title || "Why launch costs fall with cadence and reuse", cfg.note);
    var L = cfg.launches || 6, reuse = false, R = cfg.reuses || 10;
    var big = el("div", { class: "fx-big" }, body);
    var bx = el("div", { class: "fx-bars" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    function draw() {
      var F = reuse ? 400 : 300, hw = reuse ? 40 / R + 5 + 20 : 60, fixed = F / L, cost = fixed + hw;
      node._state = { launches: L, reuse: reuse, reuses: R, cost: cost };
      big.innerHTML = "<span class='fx-big-num'>€" + fmt(cost, 0) + "m</span><span class='fx-big-unit'> per launch (model)</span>";
      bars(bx, [{ label: "Share of fixed costs (factories, pads, staff)", v: fixed }, { label: "Hardware used up each flight", v: hw }, { label: "Total per launch", v: cost, me: true }], Math.max(120, cost), function (v) { return "€" + fmt(v, 0) + "m"; });
      out.innerHTML = reuse ? "Reusable: the booster flies up to " + R + " times, but recovery adds fixed costs." : "Expendable: every flight throws away a whole rocket.";
      if (node._autoCheck) node._autoCheck();
    }
    toggles(body, ["Expendable rocket", "Reusable first stage"], function (i) { reuse = i === 1; draw(); });
    slider(body, "Launches a year", 2, 160, 1, L, function (v) { L = v; draw(); });
    slider(body, "Flights per reusable booster", 1, 30, 1, R, function (v) { R = v; draw(); });
  };

  /* Mandate: the interest-rate gap a central bank needs to hold its currency */
  FIGS.mandate = function (node, cfg) {
    var body = frame(node, cfg.title || "What a doubt about the central bank costs", cfg.note);
    var rate = cfg.rate || 5.75, fed = cfg.fed || 3.875, doubt = false, base = cfg.base || 1.5, extra = cfg.extra || 1;
    var big = el("div", { class: "fx-big" }, body);
    var bx = el("div", { class: "fx-bars" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    function draw() {
      var gap = rate - fed, need = base + (doubt ? extra : 0), steady = gap >= need - 1e-9;
      node._state = { rate: rate, doubt: doubt, steady: steady, gap: gap, need: need };
      big.innerHTML = steady ? "<span class='fx-big-num'>Money stays</span><span class='fx-big-unit'> the rupiah holds</span>"
        : "<span class='fx-big-num'>Money leaves</span><span class='fx-big-unit'> the rupiah weakens</span>";
      bars(bx, [{ label: "Extra return over US rates on offer", v: gap, me: true }, { label: "Extra return investors demand", v: need }, { label: "Borrowers' cost above a 4.5% rate", v: rate - 4.5 }], 4, function (v) { return fmt(v, 2) + " pts"; });
      out.innerHTML = "Policy rate <strong>" + fmt(rate, 2) + "%</strong>; US rate taken as " + fmt(fed, 3) + "%, the middle of the Fed's range.";
      if (node._autoCheck) node._autoCheck();
    }
    toggles(body, ["Investors trust the bank", "Investors doubt its independence"], function (i) { doubt = i === 1; draw(); });
    slider(body, "Bank Indonesia's policy rate", 4.5, 7.5, 0.25, rate, function (v) { rate = v; draw(); }, function (v) { return fmt(v, 2) + "%"; });
  };

  /* Hedge: an AI crash pulls yields down, unless inflation stops the fall */
  FIGS.hedge = function (node, cfg) {
    var body = frame(node, cfg.title || "Can an AI crash and a debt scare happen together?", cfg.note);
    var start = cfg.start || 5.0, fall = 0, oil = false, sens = cfg.sens || 0.05, sensOil = cfg.sensOil || 0.02, oilAdd = cfg.oilAdd || 0.5;
    var big = el("div", { class: "fx-big" }, body);
    var bx = el("div", { class: "fx-bars" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    function draw() {
      var y = start + (oil ? oilAdd : 0) - fall * (oil ? sensOil : sens);
      node._state = { fall: fall, oil: oil, yield: y };
      big.innerHTML = "<span class='fx-big-num'>" + fmt(y, 2) + "%</span><span class='fx-big-unit'> 10-year Treasury yield (model)</span>";
      bars(bx, [{ label: "Yearly interest on $1trn of new 10-year debt", v: y * 10, me: true }, { label: "Same at Friday's 5.00%", v: start * 10 }], 80, function (v) { return "$" + fmt(v, 0) + "bn"; });
      out.innerHTML = (y < start ? "The crash helps the borrower: debt gets cheaper." : "Debt gets dearer even as shares fall: both fears at once.");
      if (node._autoCheck) node._autoCheck();
    }
    toggles(body, ["No oil shock", "Oil shock keeps inflation high"], function (i) { oil = i === 1; draw(); });
    slider(body, "Fall in AI and chip shares", 0, 50, 1, fall, function (v) { fall = v; draw(); }, function (v) { return "−" + v + "%"; });
  };

  /* Coalition: build 61 of 120 seats from a final poll */
  FIGS.coalition = function (node, cfg) {
    var body = frame(node, cfg.title || "Can anyone reach 61 seats?", cfg.note);
    var polls = cfg.polls, cur = 0, picked = {};
    var big = el("div", { class: "fx-big" }, body);
    var track = el("div", { class: "fx-bars" }, body);
    var chips = el("div", { class: "fx-toggles" }, body);
    var out = el("p", { class: "fx-readout" }, body);
    function seatsOf(name) { return polls[cur].seats[name] || 0; }
    function draw() {
      var n = 0, arab = false, bibi = false;
      cfg.parties.forEach(function (p) { if (picked[p.name]) { n += seatsOf(p.name); if (p.bloc === "arab") arab = true; if (p.bloc === "netanyahu") bibi = true; } });
      node._state = { seats: n, arab: arab, bibi: bibi, lead: !!picked[cfg.lead], poll: polls[cur].name };
      big.innerHTML = "<span class='fx-big-num'>" + n + "</span><span class='fx-big-unit'> of 120 seats · " + (n >= 61 ? "a majority" : (61 - n) + " short of 61") + "</span>";
      bars(track, [{ label: "Your coalition", v: n, me: true }, { label: "Majority line", v: 61 }], 120, function (v) { return fmt(v); });
      chips.innerHTML = "";
      cfg.parties.forEach(function (p) {
        var s = seatsOf(p.name);
        var b = el("button", { type: "button", class: "fx-party", "aria-pressed": String(!!picked[p.name]) }, chips, p.name + " " + s);
        if (s === 0) { b.disabled = true; picked[p.name] = false; b.setAttribute("aria-pressed", "false"); b.textContent = p.name + " · below threshold"; }
        b.addEventListener("click", function () { picked[p.name] = !picked[p.name]; draw(); });
      });
      out.innerHTML = "Blocs in this poll: " + cfg.blocs.map(function (bl) { var t = 0; cfg.parties.forEach(function (p) { if (p.bloc === bl.key) t += seatsOf(p.name); }); return bl.label + " " + t; }).join(" · ") + ".";
      if (node._autoCheck) node._autoCheck();
    }
    toggles(body, polls.map(function (p) { return p.name; }), function (i) { cur = i; draw(); });
    body.appendChild(chips); body.appendChild(out);
  };

  /* ---------- Reusable explanatory visuals (from 25 Oct 2026 v3) ----------
     Static diagrams use frameViz(): a visible heading (cfg.title) and an optional note (cfg.note).
     All colours come from CSS classes in brief.css (.vz-*), which use only the site's variables. */
  var vzId = 0;
  function frameViz(node, cfg, kicker) {
    node.innerHTML = "";
    node.classList.add("vz");
    var head = el("div", { class: "fx-head" }, node);
    el("span", { class: "fx-kicker" }, head, kicker || "Diagram");
    el("span", { class: "fx-title" }, head, cfg.title || "");
    var body = el("div", { class: "fx-body" }, node);
    if (cfg.title) el("p", { class: "vz-h" }, body, cfg.title);
    if (cfg.note) el("p", { class: "fx-note" }, node, cfg.note);
    return body;
  }
  // Wrap text into lines of at most n characters.
  function wrap(text, n) {
    var words = String(text).split(/\s+/), lines = [], cur = "";
    words.forEach(function (w) { if ((cur + " " + w).trim().length > n && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
    if (cur) lines.push(cur);
    return lines;
  }
  function svgText(parent, x, y, lines, cls, anchor, lh) {
    var t = svg("text", { x: x, y: y, class: cls, "text-anchor": anchor || "middle" }, parent);
    lines.forEach(function (ln, i) { var s = svg("tspan", { x: x, dy: i ? (lh || 13) : 0 }, t); s.textContent = ln; });
    return t;
  }
  function marker(s, id, cls) {
    var defs = svg("defs", null, s);
    var m = svg("marker", { id: id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    svg("path", { d: "M0,0 L10,5 L0,10 z", class: cls || "vz-arrowhead" }, m);
  }

  /* flow: boxes on a grid joined by labelled arrows.
     cfg: {title, note, cols, nodes:[{id,label,col,row,kind:"plain|good|bad|accent|ink"}],
           edges:[{from,to,label,dashed,side:"left|right" (route a loop around the side)}]} */
  FIGS.flow = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker);
    var W = 360, cols = cfg.cols || 2, gapX = cfg.gapX || (cols > 2 ? 14 : 34), padX = cfg.loop ? 26 : 6;
    var bw = (W - 2 * padX - gapX * (cols - 1)) / cols, chars = Math.floor((bw - 12) / 6.4), lh = 13.5, gapY = 34;
    var rows = 0, byId = {};
    cfg.nodes.forEach(function (n) { n._lines = wrap(n.label, chars); n._h = 14 + n._lines.length * lh; rows = Math.max(rows, n.row + 1); byId[n.id] = n; });
    var rowH = []; for (var r = 0; r < rows; r++) rowH[r] = 0;
    cfg.nodes.forEach(function (n) { rowH[n.row] = Math.max(rowH[n.row], n._h); });
    var rowY = [], y = 6; for (r = 0; r < rows; r++) { rowY[r] = y; y += rowH[r] + gapY; }
    var H = y - gapY + 6;
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "fx-svg vz-svg", role: "img", "aria-label": cfg.title || "Flow diagram" }, body);
    var mid = "vzm" + (++vzId); marker(s, mid);
    cfg.nodes.forEach(function (n) {
      var span = n.span || 1, w = bw * span + gapX * (span - 1);
      n._x = padX + n.col * (bw + gapX); n._w = w; n._y = rowY[n.row] + (rowH[n.row] - n._h) / 2;
      n._cx = n._x + w / 2; n._cy = n._y + n._h / 2;
      if (span > 1) { n._lines = wrap(n.label, Math.floor((w - 12) / 6.4)); }
    });
    var eg = svg("g", null, s), ng = svg("g", null, s), lg = svg("g", null, s);
    function edgePt(n, tx, ty) {
      var dx = tx - n._cx, dy = ty - n._cy;
      if (Math.abs(dx) * n._h > Math.abs(dy) * n._w) return [n._cx + Math.sign(dx) * n._w / 2, n._cy + dy * (n._w / 2) / Math.abs(dx || 1)];
      return [n._cx + dx * (n._h / 2) / Math.abs(dy || 1), n._cy + Math.sign(dy) * n._h / 2];
    }
    cfg.edges.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to], d, lx, ly;
      if (e.side) {
        var sx = e.side === "left" ? -1 : 1;
        var ax = e.side === "left" ? a._x : a._x + a._w, bx = e.side === "left" ? b._x : b._x + b._w;
        var ox = (e.side === "left" ? Math.min(a._x, b._x) : Math.max(a._x + a._w, b._x + b._w)) + sx * 16;
        d = "M" + ax + "," + a._cy + " L" + ox + "," + a._cy + " L" + ox + "," + b._cy + " L" + (bx + sx * 2) + "," + b._cy;
        lx = ox; ly = (a._cy + b._cy) / 2;
      } else {
        var p = edgePt(a, b._cx, b._cy), q = edgePt(b, a._cx, a._cy);
        d = "M" + p[0].toFixed(1) + "," + p[1].toFixed(1) + " L" + q[0].toFixed(1) + "," + q[1].toFixed(1);
        lx = (p[0] + q[0]) / 2; ly = (p[1] + q[1]) / 2;
      }
      svg("path", { d: d, class: "vz-edge" + (e.dashed ? " dashed" : ""), "marker-end": "url(#" + mid + ")" }, eg);
      if (e.label && e.side) {
        var rt = svg("text", { x: lx, y: ly, class: "vz-edge-label strong", "text-anchor": "middle", transform: "rotate(-90 " + lx.toFixed(1) + " " + ly.toFixed(1) + ") translate(0 -5)" }, lg);
        rt.textContent = e.label;
      } else if (e.label) {
        var lines = wrap(e.label, a.row === b.row ? Math.max(6, Math.floor((gapX - 10) / 5.6)) : 30), tw = Math.max.apply(null, lines.map(function (l) { return l.length; })) * 5.6 + 8, th = lines.length * 11 + 4;
        svg("rect", { x: lx - tw / 2, y: ly - th / 2, width: tw, height: th, class: "vz-label-bg" }, lg);
        svgText(lg, lx, ly - th / 2 + 11, lines, "vz-edge-label", "middle", 11);
      }
    });
    cfg.nodes.forEach(function (n) {
      svg("rect", { x: n._x, y: n._y, width: n._w, height: n._h, class: "vz-node " + (n.kind || "plain") }, ng);
      svgText(ng, n._cx, n._y + 7 + lh - 3, n._lines, "vz-node-text " + (n.kind || "plain"), "middle", lh);
    });
  };
  // actors: the same engine, read as "who backs whom" (backers in column 0, clients in column 1).
  FIGS.actors = function (node, cfg) { cfg.kicker = cfg.kicker || "Who backs whom"; FIGS.flow(node, cfg); };

  /* steps: an illustrated sequence. cfg: {title, note, steps:[{pic, title, text}]}
     pic names come from PICS below; unknown names draw nothing. */
  var PICS = {};
  function pic(parent, name) {
    var s = svg("svg", { viewBox: "0 0 120 64", class: "vz-pic", "aria-hidden": "true" }, parent);
    (PICS[name] || function () {})(s);
    return s;
  }
  function P(s, tag, a) { return svg(tag, a, s); }
  // Malaria: red cell (circle) and parasite (small oval) at four stages.
  PICS.cell1 = function (s) { P(s, "circle", { cx: 74, cy: 32, r: 26, class: "vz-p-cell" }); P(s, "ellipse", { cx: 30, cy: 32, rx: 11, ry: 7, class: "vz-p-bug" }); P(s, "path", { d: "M44,32 L46,32", class: "vz-p-line" }); };
  PICS.cell2 = function (s) { P(s, "circle", { cx: 74, cy: 32, r: 26, class: "vz-p-cell" }); P(s, "ellipse", { cx: 41, cy: 32, rx: 11, ry: 7, class: "vz-p-bug" }); [-8, 0, 8].forEach(function (d) { P(s, "rect", { x: 47, y: 30 + d, width: 5, height: 4, class: "vz-p-anchor" }); }); };
  PICS.cell3 = function (s) { P(s, "path", { d: "M74,6 A26,26 0 1,1 74,58 C62,50 60,40 58,32 C60,24 62,14 74,6 z", class: "vz-p-cell" }); P(s, "ellipse", { cx: 58, cy: 32, rx: 11, ry: 7, class: "vz-p-bug" }); P(s, "path", { d: "M36,32 L44,32 M40,28 L44,32 L40,36", class: "vz-p-line" }); };
  PICS.cell4 = function (s) { P(s, "circle", { cx: 74, cy: 32, r: 26, class: "vz-p-cell" }); P(s, "ellipse", { cx: 76, cy: 32, rx: 11, ry: 7, class: "vz-p-bug" }); P(s, "circle", { cx: 76, cy: 32, r: 15, class: "vz-p-ring" }); };
  PICS.rocket = function (s) { P(s, "path", { d: "M60,6 C68,14 70,30 68,44 L52,44 C50,30 52,14 60,6 z", class: "vz-p-ink" }); P(s, "path", { d: "M52,36 L44,48 L53,46 z M68,36 L76,48 L67,46 z", class: "vz-p-ink" }); P(s, "path", { d: "M55,48 L60,60 L65,48 z", class: "vz-p-hot" }); };
  PICS.mars = function (s) { P(s, "circle", { cx: 50, cy: 34, r: 22, class: "vz-p-hot" }); P(s, "circle", { cx: 92, cy: 18, r: 6, class: "vz-p-ink" }); P(s, "path", { d: "M50,10 A40,26 0 0,1 100,30", class: "vz-p-orbit" }); };
  PICS.scoop = function (s) { P(s, "path", { d: "M10,52 Q60,34 110,52 L110,64 L10,64 z", class: "vz-p-ground" }); P(s, "rect", { x: 48, y: 14, width: 24, height: 18, class: "vz-p-ink" }); P(s, "path", { d: "M52,32 L46,46 M68,32 L74,46 M60,32 L60,44", class: "vz-p-line" }); };
  PICS.earth = function (s) { P(s, "circle", { cx: 72, cy: 34, r: 22, class: "vz-p-sea" }); P(s, "path", { d: "M58,26 q8,-8 16,0 q4,8 -6,12 q-8,2 -10,-12 z", class: "vz-p-land" }); P(s, "path", { d: "M14,10 L40,26", class: "vz-p-line" }); P(s, "circle", { cx: 40, cy: 26, r: 4, class: "vz-p-ink" }); };
  PICS.school = function (s) { P(s, "path", { d: "M30,30 L60,12 L90,30 z", class: "vz-p-ink" }); P(s, "rect", { x: 34, y: 30, width: 52, height: 26, class: "vz-p-cell" }); P(s, "path", { d: "M40,40 L80,52 M80,40 L40,52", class: "vz-p-bad" }); };
  PICS.fire = function (s) { P(s, "path", { d: "M60,58 C40,58 38,38 50,26 C50,36 56,36 56,30 C56,20 62,12 66,6 C68,20 82,28 78,44 C76,54 70,58 60,58 z", class: "vz-p-hot" }); };
  PICS.tv = function (s) { P(s, "rect", { x: 30, y: 10, width: 60, height: 38, class: "vz-p-cell" }); P(s, "circle", { cx: 60, cy: 26, r: 7, class: "vz-p-ink" }); P(s, "path", { d: "M50,46 Q60,34 70,46 M50,58 L70,58 M60,48 L60,58", class: "vz-p-line" }); };
  PICS.moon = function (s) { P(s, "path", { d: "M70,8 A24,24 0 1,0 86,48 A20,20 0 1,1 70,8 z", class: "vz-p-ink" }); P(s, "rect", { x: 18, y: 40, width: 30, height: 18, class: "vz-p-cell" }); };
  PICS.ban = function (s) { P(s, "circle", { cx: 60, cy: 32, r: 24, class: "vz-p-ring-bad" }); P(s, "path", { d: "M43,15 L77,49", class: "vz-p-bad" }); };
  PICS.satellite = function (s) { P(s, "rect", { x: 52, y: 22, width: 16, height: 16, class: "vz-p-ink" }); P(s, "rect", { x: 22, y: 26, width: 28, height: 8, class: "vz-p-sea" }); P(s, "rect", { x: 70, y: 26, width: 28, height: 8, class: "vz-p-sea" }); P(s, "path", { d: "M60,38 L60,50 M52,58 Q60,48 68,58", class: "vz-p-line" }); };
  PICS.drone = function (s) { P(s, "path", { d: "M30,32 L90,32 M60,22 L60,42", class: "vz-p-line" }); [30, 90].forEach(function (x) { P(s, "ellipse", { cx: x, cy: 26, rx: 12, ry: 3, class: "vz-p-ink" }); }); P(s, "rect", { x: 52, y: 28, width: 16, height: 10, class: "vz-p-ink" }); P(s, "path", { d: "M14,52 L106,52", class: "vz-p-bad" }); };
  PICS.speed = function (s) { P(s, "path", { d: "M20,52 A40,40 0 0,1 100,52", class: "vz-p-orbit" }); P(s, "path", { d: "M60,52 L36,26", class: "vz-p-bad" }); P(s, "circle", { cx: 60, cy: 52, r: 4, class: "vz-p-ink" }); };
  PICS.check = function (s) { P(s, "circle", { cx: 60, cy: 32, r: 24, class: "vz-p-good" }); P(s, "path", { d: "M48,32 L57,41 L73,23", class: "vz-p-tick" }); };
  PICS.index = function (s) { [0, 1, 2, 3].forEach(function (i) { P(s, "rect", { x: 26 + i * 18, y: 50 - (i + 1) * 9, width: 12, height: (i + 1) * 9, class: i === 3 ? "vz-p-bad-fill" : "vz-p-ink" }); }); P(s, "path", { d: "M94,14 L94,46 M88,40 L94,46 L100,40", class: "vz-p-bad" }); };
  PICS.sell = function (s) { P(s, "rect", { x: 20, y: 16, width: 34, height: 30, class: "vz-p-cell" }); P(s, "path", { d: "M58,31 L92,31 M86,25 L92,31 L86,37", class: "vz-p-bad" }); P(s, "circle", { cx: 102, cy: 31, r: 8, class: "vz-p-ink" }); };
  PICS.down = function (s) { P(s, "path", { d: "M14,14 L40,24 L60,20 L80,40 L106,52", class: "vz-p-bad" }); P(s, "path", { d: "M14,58 L106,58", class: "vz-p-line" }); };
  PICS.ballot = function (s) { P(s, "rect", { x: 34, y: 26, width: 52, height: 32, class: "vz-p-cell" }); P(s, "rect", { x: 48, y: 22, width: 24, height: 5, class: "vz-p-ink" }); P(s, "rect", { x: 52, y: 6, width: 16, height: 20, class: "vz-p-sea" }); };
  PICS.cliff = function (s) { P(s, "path", { d: "M10,54 L54,54 L54,20 L110,20", class: "vz-p-line-strong" }); P(s, "path", { d: "M54,6 L54,60", class: "vz-p-bad-dash" }); };
  PICS.seats = function (s) { for (var i = 0; i < 12; i++) P(s, "circle", { cx: 24 + (i % 6) * 14, cy: 22 + Math.floor(i / 6) * 16, r: 5, class: i < 7 ? "vz-p-good" : "vz-p-cell" }); P(s, "path", { d: "M110,8 L110,56", class: "vz-p-bad-dash" }); };
  PICS.coins = function (s) { [0, 1, 2].forEach(function (i) { P(s, "ellipse", { cx: 50, cy: 46 - i * 9, rx: 18, ry: 6, class: "vz-p-gold" }); }); P(s, "path", { d: "M76,32 L104,32 M98,26 L104,32 L98,38", class: "vz-p-line" }); };
  PICS.bank = function (s) { P(s, "path", { d: "M26,22 L60,8 L94,22 z", class: "vz-p-ink" }); [34, 50, 66, 82].forEach(function (x) { P(s, "rect", { x: x - 3, y: 24, width: 6, height: 24, class: "vz-p-ink" }); }); P(s, "rect", { x: 24, y: 50, width: 72, height: 6, class: "vz-p-ink" }); };
  PICS.chain = function (s) { [30, 60, 90].forEach(function (x) { P(s, "ellipse", { cx: x, cy: 32, rx: 16, ry: 9, class: "vz-p-ring" }); }); };

  FIGS.steps = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker || "Step by step");
    var list = el("ol", { class: "vz-steps" }, body);
    cfg.steps.forEach(function (st, i) {
      var li = el("li", { class: "vz-step" + (st.kind ? " " + st.kind : "") }, list);
      var top = el("div", { class: "vz-step-top" }, li);
      el("span", { class: "vz-step-n" }, top, st.n || String(i + 1));
      if (st.when) el("span", { class: "vz-step-when" }, top, st.when);
      if (st.pic) pic(li, st.pic);
      el("strong", { class: "vz-step-t" }, li, st.title);
      if (st.text) el("span", { class: "vz-step-x" }, li, st.text);
    });
  };

  /* scale: bars drawn to one scale. cfg: {title, note, unit, prefix, dp, max, rows:[{label, v, kind, tag}]} */
  FIGS.scale = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker || "To scale");
    var max = cfg.max || Math.max.apply(null, cfg.rows.map(function (r) { return r.v; }));
    var wrapEl = el("div", { class: "vz-scale" }, body);
    cfg.rows.forEach(function (r) {
      var row = el("div", { class: "vz-scale-row" }, wrapEl);
      var top = el("div", { class: "vz-scale-top" }, row);
      el("span", null, top, r.label);
      el("b", null, top, (cfg.prefix || "") + fmt(r.v, cfg.dp || 0) + (cfg.unit || "") + (r.tag ? " " + r.tag : ""));
      var tr = el("div", { class: "vz-scale-track" }, row);
      el("span", { class: "vz-scale-fill " + (r.kind || ""), style: "width:" + Math.max(0.4, 100 * r.v / max).toFixed(2) + "%" }, tr);
    });
  };

  /* dots: one square per unit, coloured by group. cfg: {title, note, perRow, groups:[{label, n, kind}], mark:{at, label}} */
  FIGS.dots = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker || "Counted");
    var per = cfg.perRow || 20, total = cfg.groups.reduce(function (a, g) { return a + g.n; }, 0), rows = Math.ceil(total / per);
    var cell = 360 / per, sz = cell * 0.78, H = rows * cell + 2;
    var s = svg("svg", { viewBox: "0 0 360 " + H, class: "fx-svg vz-svg", role: "img", "aria-label": cfg.title || "Dot chart" }, body);
    var k = 0;
    cfg.groups.forEach(function (g) {
      for (var i = 0; i < g.n; i++, k++) {
        var x = (k % per) * cell + (cell - sz) / 2, y = Math.floor(k / per) * cell + (cell - sz) / 2 + 1;
        svg("rect", { x: x.toFixed(2), y: y.toFixed(2), width: sz.toFixed(2), height: sz.toFixed(2), class: "vz-dot " + (g.kind || "") + (cfg.mark && k === cfg.mark.at - 1 ? " marked" : "") }, s);
      }
    });
    var leg = el("div", { class: "fx-legend vz-legend" }, body);
    cfg.groups.forEach(function (g) { var it = el("span", null, leg); el("span", { class: "vz-sw " + (g.kind || "") }, it); it.appendChild(document.createTextNode(g.label + " " + fmt(g.n))); });
    if (cfg.mark) el("p", { class: "vz-mark-note" }, body, cfg.mark.label);
  };

  /* stack: stacked horizontal bars with an optional reference line.
     cfg: {title, note, max, unit, ref:{v,label}, rows:[{label, parts:[{label, v, kind}]}]} */
  FIGS.stack = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker || "Compared");
    var max = cfg.max || Math.max.apply(null, cfg.rows.map(function (r) { return r.parts.reduce(function (a, p) { return a + p.v; }, 0); }));
    var box = el("div", { class: "vz-stack" }, body), kinds = {};
    cfg.rows.forEach(function (r) {
      var row = el("div", { class: "vz-stack-row" }, box);
      var sum = r.parts.reduce(function (a, p) { return a + p.v; }, 0);
      var top = el("div", { class: "vz-scale-top" }, row);
      el("span", null, top, r.label);
      el("b", null, top, r.total || (fmt(sum, cfg.dp || 0) + (cfg.unit || "")));
      var tr = el("div", { class: "vz-stack-track" }, row);
      r.parts.forEach(function (p) {
        kinds[p.kind || ""] = p.label;
        var seg = el("span", { class: "vz-seg " + (p.kind || ""), style: "width:" + (100 * p.v / max).toFixed(2) + "%", title: p.label + " " + p.v }, tr);
        if (100 * p.v / max > 9) seg.textContent = fmt(p.v, cfg.dp || 0);
      });
      if (cfg.ref) { var m = el("span", { class: "vz-ref", style: "left:" + (100 * cfg.ref.v / max).toFixed(2) + "%" }, tr); m.setAttribute("aria-hidden", "true"); }
    });
    var leg = el("div", { class: "fx-legend vz-legend" }, body);
    Object.keys(kinds).forEach(function (k) { var it = el("span", null, leg); el("span", { class: "vz-sw " + k }, it); it.appendChild(document.createTextNode(kinds[k])); });
    if (cfg.ref) { var it = el("span", null, leg); el("span", { class: "vz-sw ref" }, it); it.appendChild(document.createTextNode(cfg.ref.label)); }
  };

  /* series: a few dated points joined by a line, with an optional reference line and notes on points.
     cfg: {title, note, y0, y1, unit, ref:{v,label}, points:[{x, v, note}]} */
  FIGS.series = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker || "Over time");
    var W = 360, H = 200, L = 34, R = 18, T = 22, B = 30, n = cfg.points.length;
    var X = function (i) { return L + (W - L - R) * (n > 1 ? i / (n - 1) : 0.5); };
    var Y = function (v) { return T + (H - T - B) * (1 - (v - cfg.y0) / (cfg.y1 - cfg.y0)); };
    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "fx-svg vz-svg", role: "img", "aria-label": cfg.title || "Line chart" }, body);
    svg("line", { x1: L, y1: H - B, x2: W - R, y2: H - B, class: "fx-axis-line" }, s);
    (cfg.ticks || []).forEach(function (t) { svg("line", { x1: L, x2: W - R, y1: Y(t), y2: Y(t), class: "vz-grid" }, s); svgText(s, L - 5, Y(t) + 3, [fmt(t) + (cfg.unit || "")], "fx-svg-small", "end"); });
    if (cfg.ref) { svg("line", { x1: L, x2: W - R, y1: Y(cfg.ref.v), y2: Y(cfg.ref.v), class: "fx-cursor" }, s); svgText(s, L + 4, Y(cfg.ref.v) + 12, [cfg.ref.label], "fx-svg-small", "start"); }
    var d = cfg.points.map(function (p, i) { return (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(p.v).toFixed(1); }).join("");
    svg("path", { d: d, class: "fx-line-surf" }, s);
    cfg.points.forEach(function (p, i) {
      svg("circle", { cx: X(i), cy: Y(p.v), r: 4, class: "vz-pt" }, s);
      var anchor = i === 0 ? "start" : (i === n - 1 ? "end" : "middle");
      svgText(s, X(i), Y(p.v) - 9, [fmt(p.v, cfg.dp || 0) + (cfg.unit || "")], "vz-pt-label", anchor);
      svgText(s, X(i), H - B + 15, [p.x], "fx-svg-small", anchor);
    });
    if (cfg.points.some(function (p) { return p.note; })) {
      var ul = el("ul", { class: "vz-notes" }, body);
      cfg.points.forEach(function (p) { if (p.note) el("li", null, ul, p.x + ": " + p.note); });
    }
  };

  /* schematic: a hand-drawn, not-to-scale map. Coordinates are in a 360-wide box.
     cfg: {title, note, h, regions:[{label, pts:[[x,y]...], kind:"land|sea|focus", lx, ly}], points:[{label, x, y, dx, dy, anchor, kind}],
           links:[{from:[x,y], to:[x,y], label, lx, ly, dashed, kind}]} */
  FIGS.schematic = function (node, cfg) {
    var body = frameViz(node, cfg, cfg.kicker || "Schematic map");
    var H = cfg.h || 260;
    var s = svg("svg", { viewBox: "0 0 360 " + H, class: "fx-svg vz-svg", role: "img", "aria-label": cfg.title || "Schematic map" }, body);
    var mid = "vzm" + (++vzId); marker(s, mid, "vz-arrowhead bad");
    svg("rect", { x: 0, y: 0, width: 360, height: H, class: "vz-map-sea" }, s);
    (cfg.regions || []).forEach(function (r) {
      svg("polygon", { points: r.pts.map(function (p) { return p.join(","); }).join(" "), class: "vz-map-" + (r.kind || "land") }, s);
    });
    (cfg.regions || []).forEach(function (r) { if (r.label) svgText(s, r.lx, r.ly, wrap(r.label, 12), "vz-map-label" + (r.kind === "sea" ? " sea" : ""), "middle", 12); });
    (cfg.links || []).forEach(function (l) {
      svg("path", { d: "M" + l.from.join(",") + " L" + l.to.join(","), class: "vz-edge " + (l.kind || "bad") + (l.dashed ? " dashed" : ""), "marker-end": "url(#" + mid + ")" }, s);
      if (l.label) svgText(s, l.lx, l.ly, wrap(l.label, 18), "vz-edge-label strong", "middle", 11);
    });
    (cfg.points || []).forEach(function (p) {
      svg("circle", { cx: p.x, cy: p.y, r: 3.5, class: "vz-pt " + (p.kind || "") }, s);
      svgText(s, p.x + (p.dx || 6), p.y + (p.dy || 4), wrap(p.label, 16), "vz-pt-label small", p.anchor || "start", 11);
    });
  };

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
    netBetween: function (st, p) { return st && st.net >= p.lo && st.net <= p.hi; },
    rearrangeValid: function (st) { return st && st.valid; },
    downlinkAll: function (st, p) { return st && st.share >= 1 && st.passes <= p.maxPasses && st.ratio <= p.maxRatio; },
    uniqueSat: function (st, p) { return st && st.sat >= p.min; },
    darkRatio: function (st, p) { return st && st.inside && st.ratio >= p.lo && st.ratio <= p.hi; },
    relErrBelow: function (st, p) { return st && Math.abs(st.sigma - p.sigma) < 1e-3 && st.rel <= p.max; },
    debtFlat: function (st, p) { return st && Math.abs(st.r - p.r) < 1e-6 && Math.abs(st.g - p.g) < 1e-6 && st.d10 <= st.d0 + 0.05 && st.pb <= p.maxPb + 1e-6; },
    warEnds: function (st, p) { return st && st.months <= p.months && (st.pa >= p.full || st.pr >= p.full); },
    launchBelow: function (st, p) { return st && st.cost <= p.max; },
    rupiahHolds: function (st, p) { return st && st.doubt && st.steady && st.rate <= p.maxRate + 1e-6; },
    bothFears: function (st, p) { return st && st.fall >= p.minFall && st.yield >= p.minYield - 1e-9; },
    majorityNoArab: function (st) { return st && st.seats >= 61 && st.lead && !st.arab; }
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
