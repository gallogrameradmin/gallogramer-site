/* «Выжил бы ты?» v3 — Phaser 3. Все тексты и факты — в data.js. */
(function () {
  'use strict';
  var D = window.GAME_DATA;
  var W = 390, H = 844;
  var DPR = window.devicePixelRatio || 1;
  var Z = Math.min(2.5, Math.max(1, DPR));
  var RM = false;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var FONT = 'Georgia, "Times New Roman", "PT Serif", "Noto Serif", serif';
  var C = {
    paper: 0xefe4cc, paper2: 0xe6d6b2, land: 0xdcc79c, ink: 0x3b2a1a, ink2: 0x6b5236,
    red: 0x8e2b20, green: 0x3f7a3a, amber: 0xb8862b, dim: 0x9c8a6c, sea: 0xcfc3a0, card: 0xf6eedb
  };
  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  var LZ = {}; D.lazarets.forEach(function (l) { LZ[l.id] = l; });

  /* ---------- память (localStorage в try/catch) ---------- */
  var KEY = 'igra3_progress_v1';
  function loadProg() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveProg(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var PROG = loadProg();
  if (!PROG.stars) PROG.stars = {};
  if (!PROG.year) PROG.year = 1812;

  /* ---------- общие помощники ---------- */
  function setupCam(scene) {
    var cam = scene.cameras.main;
    cam.setZoom(Z);
    cam.centerOn(W / 2, H / 2);
    cam.setBackgroundColor(hex(C.paper));
    scene.add.image(W / 2, H / 2, 'paper').setDisplaySize(W, H);
    if (!RM) cam.fadeIn(220, 239, 228, 204);
  }
  function T(scene, x, y, str, size, color, o) {
    o = o || {};
    var st = {
      fontFamily: FONT, fontSize: size + 'px', color: color || hex(C.ink),
      resolution: Z, align: o.align || 'left', lineSpacing: o.ls != null ? o.ls : 3
    };
    if (o.bold) st.fontStyle = 'bold';
    if (o.italic) st.fontStyle = (o.bold ? 'bold ' : '') + 'italic';
    if (o.wrap) st.wordWrap = { width: o.wrap, useAdvancedWrap: true };
    var t = scene.add.text(x, y, str, st);
    if (o.origin != null) t.setOrigin(o.origin[0], o.origin[1]);
    return t;
  }
  function wpt(scene, pointer) { return scene.cameras.main.getWorldPoint(pointer.x, pointer.y); }

  function button(scene, x, y, w, h, label, cb, o) {
    o = o || {};
    var fill = o.fill != null ? o.fill : C.red, col = o.color || '#f6eedb';
    var c = scene.add.container(x, y);
    var g = scene.add.graphics();
    function draw(pressed) {
      g.clear();
      g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 12);
      g.fillStyle(fill, 1); g.fillRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, 12);
      g.lineStyle(2, C.ink, 0.55); g.strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 2 : 0), w, h, 12);
    }
    draw(false);
    var t = T(scene, 0, 0, label, o.size || 18, col, { bold: true, origin: [0.5, 0.5], align: 'center' });
    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () { draw(true); t.y = 2; });
    c.on('pointerout', function () { draw(false); t.y = 0; });
    c.on('pointerup', function () { draw(false); t.y = 0; cb && cb(); });
    c.label = t;
    return c;
  }
  function toast(scene, msg, color) {
    var c = scene.add.container(W / 2, H - 120).setDepth(1000);
    var t = T(scene, 0, 0, msg, 15, '#f6eedb', { wrap: 320, align: 'center', origin: [0.5, 0.5] });
    var g = scene.add.graphics();
    var bw = Math.min(350, t.width + 28), bh = t.height + 20;
    g.fillStyle(color || C.ink, 0.94); g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 12);
    c.add([g, t]);
    c.alpha = 0;
    scene.tweens.add({ targets: c, alpha: 1, duration: 150 });
    scene.time.delayedCall(2600, function () {
      scene.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: function () { c.destroy(); } });
    });
    return c;
  }

  /* ---------- значки предметов (рисуются кодом) ---------- */
  function icon(g, key, x, y, s) {
    var k = s / 44, ink = C.ink, wht = 0xfbf6ea, red = C.red;
    function R(a, b, w, h, col, al) { g.fillStyle(col, al == null ? 1 : al); g.fillRect(x + a * k, y + b * k, w * k, h * k); }
    function RR(a, b, w, h, r, col) { g.fillStyle(col, 1); g.fillRoundedRect(x + a * k, y + b * k, w * k, h * k, r * k); }
    function SR(a, b, w, h, r) { g.lineStyle(2, ink, 1); g.strokeRoundedRect(x + a * k, y + b * k, w * k, h * k, r * k); }
    function Ci(a, b, r, col) { g.fillStyle(col, 1); g.fillCircle(x + a * k, y + b * k, r * k); }
    function SC(a, b, r) { g.lineStyle(2, ink, 1); g.strokeCircle(x + a * k, y + b * k, r * k); }
    function L(a, b, c2, d, w, col) { g.lineStyle((w || 2) * k, col == null ? ink : col, 1); g.lineBetween(x + a * k, y + b * k, x + c2 * k, y + d * k); }
    function cross(a, b, sz) { R(a - sz / 2, b - sz / 6, sz, sz / 3, red); R(a - sz / 6, b - sz / 2, sz / 3, sz, red); }
    switch (key) {
      case 'fluff':
        [[-8, 2, 9], [6, 0, 10], [-1, -9, 9], [0, 9, 8], [12, 10, 6], [-13, -6, 6]].forEach(function (p) { Ci(p[0], p[1], p[2], wht); SC(p[0], p[1], p[2]); });
        break;
      case 'roll':
        RR(-2, 6, 22, 10, 2, wht); SR(-2, 6, 22, 10, 2);
        Ci(-6, 0, 14, wht); SC(-6, 0, 14); SC(-6, 0, 5); break;
      case 'tools':
        L(-16, 14, 12, -14, 4); RR(-18, 10, 10, 8, 2, C.ink2);
        L(-14, -14, 14, 14, 3);
        for (var i = 0; i < 5; i++) L(-10 + i * 5, -10 + i * 5, -13 + i * 5, -7 + i * 5, 2);
        break;
      case 'cart':
        RR(-18, -8, 36, 14, 2, 0xa77b46); SR(-18, -8, 36, 14, 2);
        Ci(-10, 10, 8, wht); SC(-10, 10, 8); Ci(12, 10, 8, wht); SC(12, 10, 8);
        L(18, -2, 22, -14, 3); break;
      case 'bottle':
        RR(-5, -18, 10, 10, 2, 0x9aa7a0); SR(-5, -18, 10, 10, 2);
        Ci(0, 6, 14, 0xb9c6bf); SC(0, 6, 14); RR(-8, 2, 16, 8, 2, wht); break;
      case 'cast':
        RR(-8, -18, 16, 36, 7, wht); SR(-8, -18, 16, 36, 7);
        for (var j = -12; j <= 12; j += 6) L(-8, j, 8, j + 4, 1.5); break;
      case 'nurse':
        Ci(0, 2, 11, 0xe9c9a5); SC(0, 2, 11);
        RR(-14, -14, 28, 12, 4, wht); SR(-14, -14, 28, 12, 4); cross(0, -8, 8);
        RR(-16, 14, 32, 10, 4, 0x5a6a7a); break;
      case 'packet':
        RR(-16, -12, 32, 24, 3, wht); SR(-16, -12, 32, 24, 3); cross(0, 0, 14); break;
      case 'stretcher':
        L(-20, -6, 20, -6, 3); L(-20, 6, 20, 6, 3);
        R(-14, -6, 28, 12, 0xc9b48a); L(-12, -6, -12, 6, 2); L(12, -6, 12, 6, 2); break;
      case 'train':
        RR(-20, -12, 40, 20, 3, 0x6d7b63); SR(-20, -12, 40, 20, 3);
        cross(0, -2, 12); Ci(-12, 12, 5, ink); Ci(12, 12, 5, ink); break;
      case 'wagon':
        R(-20, 0, 40, 6, 0xa77b46); L(-20, 0, 20, 0, 2);
        Ci(-12, 12, 5, ink); Ci(12, 12, 5, ink); L(-14, 0, -14, -8, 2); L(14, 0, 14, -8, 2); break;
      case 'isolate':
        RR(-18, -10, 36, 22, 3, 0xcfc3a0); SR(-18, -10, 36, 22, 3);
        L(-18, -10, 18, 12, 2, red); L(18, -10, -18, 12, 2, red);
        Ci(-10, 16, 4, ink); Ci(10, 16, 4, ink); break;
      case 'tourniquet':
        RR(-20, -5, 40, 10, 4, 0x2f2f2f); RR(-4, -14, 8, 28, 3, red); SR(-4, -14, 8, 28, 3); break;
      case 'splint':
        RR(-18, -14, 8, 30, 2, 0xb08a52); RR(10, -14, 8, 30, 2, 0xb08a52);
        RR(-20, -6, 40, 5, 2, wht); RR(-20, 6, 40, 5, 2, wht); break;
      case 'grain':
        L(0, 18, 0, -16, 2, 0x8a6a2a);
        for (var m = 0; m < 4; m++) { g.fillStyle(0xc9a24a, 1); g.fillEllipse(x - 5 * k, y + (-12 + m * 7) * k, 8 * k, 5 * k); g.fillEllipse(x + 5 * k, y + (-10 + m * 7) * k, 8 * k, 5 * k); }
        break;
      case 'rice':
        g.fillStyle(0x8a5a3a, 1); g.slice(x, y - 2 * k, 18 * k, 0, Math.PI, false); g.fillPath();
        Ci(-6, -4, 4, wht); Ci(0, -6, 4, wht); Ci(6, -4, 4, wht); Ci(-2, -2, 4, wht); Ci(4, -2, 4, wht); break;
      case 'mask':
        RR(-16, -8, 32, 18, 7, wht); SR(-16, -8, 32, 18, 7);
        L(-16, -4, -22, -10, 2); L(16, -4, 22, -10, 2); L(-10, 0, 10, 0, 1); L(-10, 4, 10, 4, 1); break;
      case 'spray':
        RR(-10, -8, 20, 24, 3, 0x7f8f7f); SR(-10, -8, 20, 24, 3);
        L(10, -4, 20, -12, 3); [[-4, -16], [4, -18], [0, -22]].forEach(function (p) { Ci(p[0], p[1], 2, ink); }); break;
      case 'barrier':
        L(-16, -2, -16, 16, 3); L(16, -2, 16, 16, 3);
        for (var n = 0; n < 4; n++) R(-20 + n * 10, -6, 10, 6, n % 2 ? wht : red);
        g.lineStyle(1.5, ink, 1); g.strokeRect(x - 20 * k, y - 6 * k, 40 * k, 6 * k); break;
      case 'pills':
        Ci(-8, 4, 6, 0x8a5a3a); Ci(6, -2, 6, 0x8a5a3a); Ci(4, 12, 6, 0x8a5a3a); SC(-8, 4, 6); SC(6, -2, 6); SC(4, 12, 6); break;
      case 'mule':
        g.fillStyle(0x7a6048, 1); g.fillEllipse(x, y + 2 * k, 30 * k, 14 * k);
        L(-10, 8, -10, 18, 3, 0x7a6048); L(10, 8, 10, 18, 3, 0x7a6048);
        L(14, -2, 20, -10, 5, 0x7a6048); RR(-10, -12, 18, 10, 2, wht); SR(-10, -12, 18, 10, 2); cross(-1, -7, 7); break;
      case 'radio':
        RR(-14, -8, 28, 24, 3, 0x5b6342); SR(-14, -8, 28, 24, 3); L(8, -8, 14, -22, 2);
        Ci(-6, 4, 4, wht); R(2, 0, 8, 2, wht); R(2, 6, 8, 2, wht); break;
      case 'heli':
        g.fillStyle(0x5b6342, 1); g.fillEllipse(x - 6 * k, y + 2 * k, 22 * k, 16 * k);
        L(4, 2, 20, 0, 3, 0x5b6342); L(-22, -10, 14, -10, 2); L(-4, -10, -4, -6, 2);
        L(-14, 12, 2, 12, 2); RR(-16, 14, 20, 5, 2, wht); break;
      default:
        Ci(0, 0, 14, wht); SC(0, 0, 14);
    }
  }

  /* фигурка пациента */
  var UNIFORM = { russia: 0x55603f, japan: 0x323d4f, china: 0x5d5a48, korea: 0x7a6b3c };
  function figure(g, cx, cy, region, kind, grey) {
    if (kind === 'house') {
      g.fillStyle(grey ? 0x9a9a9a : 0xa77b46, 1); g.fillRect(cx - 20, cy - 4, 40, 26);
      g.fillStyle(grey ? 0x777777 : 0x6b4a2a, 1); g.fillTriangle(cx - 26, cy - 2, cx + 26, cy - 2, cx, cy - 24);
      g.fillStyle(0x3b2a1a, 1); g.fillRect(cx - 5, cy + 8, 10, 14);
      return;
    }
    var body = grey ? 0x8a8a8a : (kind === 'sick' ? 0x6e6a5c : UNIFORM[region] || 0x55603f);
    g.fillStyle(body, 1); g.fillRoundedRect(cx - 20, cy + 2, 40, 26, 12);
    g.fillStyle(grey ? 0xb0b0b0 : 0xe2bf98, 1); g.fillCircle(cx, cy - 10, 12);
    g.lineStyle(2, C.ink, 0.8); g.strokeCircle(cx, cy - 10, 12);
    g.fillStyle(grey ? 0x777777 : 0x3b2a1a, 1); g.fillRect(cx - 4, cy - 12, 2, 3); g.fillRect(cx + 3, cy - 12, 2, 3);
  }
  /* силуэт наставника */
  function mentorSil(g, cx, cy, kind) {
    g.fillStyle(C.paper2, 1); g.fillCircle(cx, cy, 38); g.lineStyle(3, C.ink, 1); g.strokeCircle(cx, cy, 38);
    g.fillStyle(C.ink, 1);
    g.fillCircle(cx, cy - 6, 13);
    g.fillRoundedRect(cx - 24, cy + 10, 48, 30, 14);
    if (kind === 'shako') { g.fillRect(cx - 11, cy - 34, 22, 18); g.fillRect(cx - 14, cy - 18, 28, 4); }
    else if (kind === 'nurse') { g.fillStyle(0xfbf6ea, 1); g.fillRoundedRect(cx - 17, cy - 24, 34, 14, 5); g.fillStyle(C.red, 1); g.fillRect(cx - 5, cy - 20, 10, 4); g.fillRect(cx - 2, cy - 23, 4, 10); }
    else if (kind === 'cap' || kind === 'kepi') { g.fillRect(cx - 14, cy - 24, 28, 9); g.fillRect(cx - 4, cy - 16, 22, 3); }
    else if (kind === 'helmet') { g.slice(cx, cy - 12, 17, Math.PI, 0, false); g.fillPath(); g.fillRect(cx - 20, cy - 13, 40, 3); }
    else if (kind === 'doctor') { g.lineStyle(2, C.paper2, 1); g.strokeCircle(cx - 5, cy - 6, 4); g.strokeCircle(cx + 5, cy - 6, 4); }
  }
  function star(g, cx, cy, r, filled) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
    }
    g.fillStyle(filled ? C.amber : C.paper2, 1); g.fillPoints(pts, true);
    g.lineStyle(2, C.ink, 1); g.strokePoints(pts, true);
  }

  /* ================= BOOT ================= */
  var Boot = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function Boot() { Phaser.Scene.call(this, { key: 'Boot' }); },
    create: function () {
      var cw = W * 2, ch = H * 2;
      var tex = this.textures.createCanvas('paper', cw, ch);
      var ctx = tex.getContext();
      var gr = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.2, cw / 2, ch / 2, ch * 0.75);
      gr.addColorStop(0, '#f2e8d2'); gr.addColorStop(1, '#d9c59c');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, cw, ch);
      var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < 2600; i++) {
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(90,60,30,0.06)' : 'rgba(255,255,255,0.10)';
        ctx.fillRect(rnd() * cw, rnd() * ch, 1 + rnd() * 3, 1 + rnd() * 3);
      }
      tex.refresh();
      var start = 'Map';
      if (window.__test && window.__test.startScene) start = window.__test.startScene;
      this.scene.start(start);
    }
  });

  /* ================= MAP ================= */
  var REG = {
    russia: { pts: [[14, 100], [376, 100], [378, 232], [340, 250], [300, 240], [270, 262], [230, 250], [190, 268], [150, 256], [110, 270], [70, 262], [40, 272], [14, 262]], lx: 195, ly: 150, ex: 195, ey: 205 },
    china: { pts: [[30, 290], [110, 280], [150, 288], [190, 276], [232, 268], [258, 280], [262, 318], [244, 336], [250, 372], [232, 410], [250, 450], [220, 492], [160, 506], [100, 496], [60, 462], [34, 420], [24, 360]], lx: 140, ly: 360, ex: 140, ey: 410 },
    korea: { pts: [[268, 296], [292, 288], [308, 306], [302, 330], [312, 356], [300, 392], [282, 404], [270, 384], [276, 352], [262, 328]], lx: 282, ly: 422, ex: 84, ey: 522, legend: true },
    japan: { pts: [[338, 300], [352, 292], [362, 312], [358, 344], [350, 376], [338, 404], [326, 420], [316, 414], [326, 394], [334, 364], [336, 332]], extra: [[[350, 262], [368, 258], [374, 276], [360, 286], [348, 278]], [[318, 436], [332, 432], [336, 452], [322, 458]]], lx: 334, ly: 474, ex: 84, ey: 540, legend: true }
  };
  var MARKS = D.marks;
  var TX0 = 30, TX1 = 338;
  function yearToX(y) {
    if (y <= MARKS[0].y) return TX0;
    var seg = (TX1 - TX0) / (MARKS.length - 1);
    for (var i = 0; i < MARKS.length - 1; i++) {
      if (y <= MARKS[i + 1].y) return TX0 + seg * (i + (y - MARKS[i].y) / (MARKS[i + 1].y - MARKS[i].y));
    }
    return TX1;
  }
  function xToYear(x) {
    var seg = (TX1 - TX0) / (MARKS.length - 1);
    var f = Math.max(0, Math.min(MARKS.length - 1, (x - TX0) / seg));
    var i = Math.min(MARKS.length - 2, Math.floor(f));
    return Math.round(MARKS[i].y + (f - i) * (MARKS[i + 1].y - MARKS[i].y));
  }
  function activeLz(region, year) {
    for (var i = 0; i < D.lazarets.length; i++) { var l = D.lazarets[i]; if (l.region === region && year >= l.from && year <= l.to) return l; }
    return null;
  }
  function yearLabel(y) { return y >= 2024 ? 'Наши дни' : y + ' год'; }

  var MapScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function MapScene() { Phaser.Scene.call(this, { key: 'Map' }); },
    create: function () {
      var s = this; setupCam(s);
      window.__scene = s;
      s.year = PROG.year || 1812;
      T(s, W / 2, 30, 'Выжил бы ты?', 30, hex(C.red), { bold: true, origin: [0.5, 0.5] });
      T(s, W / 2, 62, 'Военно-полевая медицина · 1700 — наши дни', 14, hex(C.ink2), { italic: true, origin: [0.5, 0.5] });

      // море и рамка
      var g = s.add.graphics();
      g.fillStyle(C.sea, 0.55); g.fillRoundedRect(8, 86, W - 16, 470, 10);
      g.lineStyle(1, C.ink2, 0.25);
      for (var yy = 100; yy < 550; yy += 14) for (var xx = 20 + (yy % 28 ? 7 : 0); xx < W - 20; xx += 28) g.lineBetween(xx, yy, xx + 8, yy - 2);
      g.lineStyle(3, C.ink, 0.8); g.strokeRoundedRect(8, 86, W - 16, 470, 10);
      g.lineStyle(1, C.ink, 0.6); g.strokeRoundedRect(13, 91, W - 26, 460, 8);
      // роза ветров
      var rx = 52, ry = 515;
      g.fillStyle(C.ink, 0.8); g.fillTriangle(rx, ry - 24, rx - 6, ry, rx + 6, ry);
      g.fillStyle(C.paper, 1); g.fillTriangle(rx, ry + 24, rx - 6, ry, rx + 6, ry);
      g.lineStyle(1, C.ink, 0.8); g.strokeTriangle(rx, ry + 24, rx - 6, ry, rx + 6, ry); g.strokeCircle(rx, ry, 14);
      T(s, rx, ry - 34, 'С', 12, hex(C.ink), { bold: true, origin: [0.5, 0.5] });

      s.regions = {};
      Object.keys(REG).forEach(function (key) {
        var R = REG[key];
        var polys = [R.pts].concat(R.extra || []);
        var rg = s.add.graphics();
        var glow = s.add.graphics();
        var hit = s.add.graphics();
        polys.forEach(function (pp) {
          var poly = new Phaser.Geom.Polygon(pp.map(function (p) { return new Phaser.Geom.Point(p[0], p[1]); }));
          var z = s.add.zone(0, 0, W, H).setOrigin(0, 0);
          z.setInteractive(poly, Phaser.Geom.Polygon.Contains);
          z.input.cursor = 'pointer';
          z.on('pointerup', function () { s.tapRegion(key); });
        });
        var name = T(s, R.lx, R.ly, D.regions[key].name.toUpperCase(), key === 'korea' || key === 'japan' ? 14 : 19, hex(C.ink), { bold: true, origin: [0.5, 0.5] });
        name.setLetterSpacing && name.setLetterSpacing(2);
        var seals = T(s, R.lx, R.ly + (key === 'russia' || key === 'china' ? 20 : 17), '', 13, hex(C.red), { origin: [0.5, 0.5] });
        var ev = R.legend ? T(s, R.ex, R.ey, '', 13, hex(C.ink), { origin: [0, 0.5], italic: true })
          : T(s, R.ex, R.ey, '', 13, hex(C.ink), { wrap: 230, align: 'center', origin: [0.5, 0], italic: true });
        s.regions[key] = { g: rg, glow: glow, polys: polys, name: name, seals: seals, ev: ev };
      });
      s.pulse = 0;

      // инфо-панель
      s.infoG = s.add.graphics();
      s.infoG.fillStyle(C.card, 0.85); s.infoG.fillRoundedRect(10, 562, W - 20, 132, 10);
      s.infoG.lineStyle(1.5, C.ink2, 0.6); s.infoG.strokeRoundedRect(10, 562, W - 20, 132, 10);
      s.infoHead = T(s, 22, 570, '', 15, hex(C.red), { bold: true });
      s.infoText = T(s, 22, 592, '', 14, hex(C.ink), { wrap: W - 44, ls: 2 });
      s.infoPlay = T(s, W / 2, 680, '', 14, hex(C.green), { bold: true, origin: [0.5, 0.5], align: 'center' });

      // шкала времени
      s.yearT = T(s, W / 2, 712, '', 22, hex(C.ink), { bold: true, origin: [0.5, 0.5] });
      var tg = s.add.graphics();
      tg.lineStyle(6, C.ink2, 0.5); tg.lineBetween(TX0, 744, TX1, 744);
      tg.lineStyle(2, C.ink, 0.9); tg.lineBetween(TX0, 744, TX1, 744);
      MARKS.forEach(function (m) {
        var x = yearToX(m.y);
        tg.lineStyle(2, C.ink, 1); tg.lineBetween(x, 736, x, 752);
        var lt = T(s, x, 768, m.l, 13, hex(C.ink2), { origin: [0.5, 0.5], bold: true });
        var z = s.add.zone(x, 764, 44, 30).setInteractive({ useHandCursor: true });
        z.on('pointerup', function () { s.setYear(m.y, true); });
      });
      // дорожка — тоже кликабельна
      var trackZone = s.add.zone((TX0 + TX1) / 2, 744, TX1 - TX0 + 30, 40).setInteractive();
      trackZone.on('pointerdown', function (p) { var w = wpt(s, p); s.setYear(xToYear(w.x)); });
      s.thumb = s.add.container(yearToX(s.year), 744);
      var thG = s.add.graphics();
      thG.fillStyle(0x000000, 0.2); thG.fillCircle(1, 3, 15);
      thG.fillStyle(C.red, 1); thG.fillCircle(0, 0, 15); thG.lineStyle(3, C.paper, 1); thG.strokeCircle(0, 0, 9);
      s.thumb.add(thG);
      s.thumb.setSize(48, 48); s.thumb.setInteractive({ useHandCursor: true, draggable: true });
      s.thumb.on('drag', function (p) { var w = wpt(s, p); s.setYear(xToYear(Math.max(TX0, Math.min(TX1, w.x)))); });

      // нижние кнопки
      button(s, 92, 814, 150, 44, 'Об игре', function () { s.scene.start('About'); }, { fill: C.paper2, color: hex(C.ink), size: 16 });
      var done = Object.keys(PROG.stars).length;
      s.progT = T(s, 290, 814, 'Пройдено: ' + done + ' из ' + D.lazarets.length, 15, hex(C.ink), { origin: [0.5, 0.5], bold: true });

      s.setYear(s.year, true);
    },
    setYear: function (y, snap) {
      var s = this;
      y = Math.max(1700, Math.min(2024, y));
      s.year = y; PROG.year = y; saveProg(PROG);
      s.thumb.x = yearToX(y);
      s.yearT.setText(yearLabel(y));
      var avail = [];
      Object.keys(REG).forEach(function (key) {
        var r = s.regions[key], lz = activeLz(key, y);
        r.lz = lz;
        var g = r.g; g.clear();
        r.polys.forEach(function (pp) {
          var pts = pp.map(function (p) { return { x: p[0], y: p[1] }; });
          g.fillStyle(lz ? 0xe9cf98 : C.land, 1); g.fillPoints(pts, true);
          if (!lz) { g.fillStyle(0x5a4a35, 0.28); g.fillPoints(pts, true); }
          g.lineStyle(2, C.ink, lz ? 1 : 0.6); g.strokePoints(pts, true);
        });
        r.name.setAlpha(lz ? 1 : 0.55);
        // печати: пройденные лазареты региона
        var list = D.lazarets.filter(function (l) { return l.region === key; });
        r.seals.setText(list.map(function (l) { return PROG.stars[l.id] ? '●' : '○'; }).join(' '));
        // ближайшее событие региона
        var best = null, bd = 1e9;
        D.timeline.forEach(function (e) { if (e.r === key) { var d = Math.abs(e.y - y); if (d < bd) { bd = d; best = e; } } });
        var label = '';
        if (lz) label = (key === 'korea' || key === 'japan' ? D.regions[key].name + ': ' : '') + lz.yearLabel + ' · ' + lz.title;
        else if (best && bd <= 12) label = (key === 'korea' || key === 'japan' ? D.regions[key].name + ': ' : '') + best.y + ' · ' + best.s;
        if (REG[key].legend && label.length > 38) label = label.slice(0, 37) + '…';
        r.ev.setText(label); r.ev.setColor(lz ? hex(C.red) : hex(C.ink2)); r.ev.setFontStyle(lz ? 'bold italic' : 'italic');
        if (lz) avail.push(D.regions[key].name + ' — ' + lz.title);
      });
      // инфо: ближайшее событие вообще
      var best = null, bd = 1e9;
      D.timeline.forEach(function (e) { var d = Math.abs(e.y - y); if (d < bd) { bd = d; best = e; } });
      s.infoHead.setText((best.y >= 2020 ? 'Наше время' : best.y) + ' · ' + D.regions[best.r].name);
      s.infoText.setText(best.t);
      s.infoPlay.setText(avail.length ? 'Нажми на подсвеченный регион ▸ ' + avail.length + (avail.length > 1 ? ' смены' : ' смена') : 'В эти годы смен нет — подвинь шкалу');
      s.infoPlay.setColor(avail.length ? hex(C.green) : hex(C.ink2));
    },
    update: function (t, dt) {
      var s = this;
      if (!s.regions) return;
      s.pulse += dt / 1000;
      var a = RM ? 0.8 : 0.45 + 0.4 * Math.sin(s.pulse * 4);
      Object.keys(s.regions).forEach(function (key) {
        var r = s.regions[key]; r.glow.clear();
        if (!r.lz) return;
        r.polys.forEach(function (pp) {
          var pts = pp.map(function (p) { return { x: p[0], y: p[1] }; });
          r.glow.lineStyle(5, C.red, a); r.glow.strokePoints(pts, true);
        });
      });
    },
    tapRegion: function (key) {
      var s = this, lz = activeLz(key, s.year);
      if (lz) { s.scene.start('Brief', { id: lz.id }); return; }
      var list = D.lazarets.filter(function (l) { return l.region === key; }).map(function (l) { return l.yearLabel; });
      toast(s, D.regions[key].name + ': в ' + s.year + ' году смены нет. Попробуй: ' + list.join(', ') + '.');
    }
  });

  /* ================= BRIEF ================= */
  var Brief = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function Brief() { Phaser.Scene.call(this, { key: 'Brief' }); },
    create: function (data) {
      var s = this; setupCam(s); window.__scene = s;
      var lz = LZ[data.id]; s.lz = lz;
      var g = s.add.graphics();
      g.fillStyle(C.red, 1); g.fillRoundedRect(20, 24, 170, 34, 8);
      T(s, 105, 41, D.regions[lz.region].name + ' · ' + lz.yearLabel, 16, '#f6eedb', { bold: true, origin: [0.5, 0.5] });
      if (PROG.stars[lz.id]) {
        var sg = s.add.graphics();
        for (var i = 0; i < 3; i++) star(sg, 300 + i * 26, 41, 11, i < PROG.stars[lz.id]);
      }
      var y = 74;
      var t1 = T(s, 20, y, lz.title, 30, hex(C.ink), { bold: true, wrap: 350 }); y += t1.height + 4;
      var t2 = T(s, 20, y, lz.place, 16, hex(C.ink2), { italic: true, wrap: 350 }); y += t2.height + 12;
      var t3 = T(s, 20, y, lz.brief, 17, hex(C.ink), { wrap: 350, ls: 4 }); y += t3.height + 16;
      T(s, 20, y, 'Аптечка эпохи:', 16, hex(C.red), { bold: true }); y += 26;
      var cols = 3, tw = 112, th = 84;
      lz.kit.forEach(function (it, i) {
        var cx = 20 + (i % cols) * (tw + 7), cy = y + Math.floor(i / cols) * (th + 7);
        var gg = s.add.graphics();
        gg.fillStyle(C.card, 1); gg.fillRoundedRect(cx, cy, tw, th, 8);
        gg.lineStyle(1.5, C.ink2, 0.7); gg.strokeRoundedRect(cx, cy, tw, th, 8);
        icon(gg, it.icon, cx + tw / 2, cy + 28, 36);
        T(s, cx + tw / 2, cy + 62, it.name, 13, hex(C.ink), { origin: [0.5, 0.5], align: 'center', wrap: tw - 8, bold: true });
      });
      y += Math.ceil(lz.kit.length / cols) * (th + 7) + 6;
      var how = lz.triage
        ? 'Сначала сортировка: тяни нового раненого в зону «' + lz.triage.map(function (z) { return z.name; }).join('» / «') + '». Потом лечи: перетаскивай предмет из аптечки на пациента.'
        : 'Перетаскивай предмет из аптечки на пациента. Полоска показывает его состояние — не дай ей опустеть.';
      T(s, 20, y, how, 15, hex(C.ink2), { wrap: 350, italic: true });
      button(s, W / 2, 760, 320, 56, 'В лазарет ▸', function () { s.scene.start('Ward', { id: lz.id }); }, { size: 21 });
      button(s, W / 2, 816, 200, 44, '← На карту', function () { s.scene.start('Map'); }, { fill: C.paper2, color: hex(C.ink), size: 16 });
    }
  });

  /* ================= WARD (лазарет) ================= */
  var BED_Y = [158, 286, 414], BED_H = 120, CARD_X = 12, CARD_W = 366;
  var KIT_Y = 584, ARR_Y = 76, ARR_H = 74;

  function shuffle(a, rnd) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var Ward = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function Ward() { Phaser.Scene.call(this, { key: 'Ward' }); },
    create: function (data) {
      var s = this; setupCam(s); window.__scene = s;
      var lz = LZ[data.id]; s.lz = lz;
      s.input.dragDistanceThreshold = 6;
      s.speed = (window.__test && window.__test.speed) || 1;
      s.state = 'tutorial';
      s.timeLeft = lz.duration;
      s.beds = [null, null, null];
      s.arrival = null;
      s.stats = { saved: 0, lost: 0, relieved: 0, triOk: 0, triAll: 0, mistakes: 0, total: 0 };
      s.selected = null;

      // очередь пациентов
      var seed = Date.now() % 100000 + 1; var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      var types = lz.patients.slice();
      var first = lz.patients[lz.mentor.task.patient];
      var pool = shuffle(types.slice(), rnd);
      var list = [first];
      var k = 0;
      while (list.length < lz.total) { list.push(pool[k % pool.length]); k++; if (k % pool.length === 0) shuffle(pool, rnd); }
      s.queue = list.map(function (tp, i) { return { type: tp, name: lz.names[i % lz.names.length] }; });
      s.toSpawn = s.queue.slice(1);
      s.stats.total = s.queue.filter(function (q) { return q.type.zone !== 'hopeless'; }).length;
      s.spawnT = 0.6;

      // запасы: сколько нужно + 1 (дефицитные предметы, никому не обязательные, — из data)
      var need = {};
      s.queue.forEach(function (q) { q.type.steps.forEach(function (st) { var id = st.item || st.any[st.any.length - 1]; need[id] = (need[id] || 0) + 1; }); });
      s.stock = {};
      lz.kit.forEach(function (it) { s.stock[it.id] = need[it.id] ? need[it.id] + 1 : it.count; });

      s.buildHeader();
      s.buildKit();
      s.hint = T(s, W / 2, 572, '', 15, hex(C.ink), { origin: [0.5, 1], align: 'center', wrap: 370, bold: true, ls: 0 });
      s.zonesC = null;
      s.fx = s.add.container(0, 0).setDepth(500);

      // тестовый хук / обучение
      if (window.__test && window.__test.skipTutorial) { s.startShift(true); }
      else s.startTutorial();
    },

    /* ----- шапка ----- */
    buildHeader: function () {
      var s = this, lz = s.lz;
      var g = s.add.graphics();
      g.fillStyle(C.ink, 0.92); g.fillRect(0, 0, W, 66);
      var x = s.add.container(30, 24); var xg = s.add.graphics();
      xg.lineStyle(3, C.paper, 1); xg.lineBetween(-7, -7, 7, 7); xg.lineBetween(7, -7, -7, 7);
      x.add(xg); x.setSize(44, 44); x.setInteractive({ useHandCursor: true });
      x.on('pointerup', function () { s.scene.start('Map'); });
      T(s, 60, 12, lz.title + ' · ' + lz.yearLabel, 17, '#f6eedb', { bold: true });
      s.statT = T(s, 60, 36, '', 13, '#e6d6b2');
      s.timerT = T(s, W - 14, 22, '', 22, '#f6eedb', { bold: true, origin: [1, 0.5] });
      s.timerBar = s.add.graphics();
      s.updateHeader();
    },
    updateHeader: function () {
      var s = this, st = s.stats;
      var left = s.toSpawn.length + (s.arrival ? 1 : 0) + (s.waitingTriaged ? s.waitingTriaged.length : 0);
      s.statT.setText(s.lz.goalWord + ': ' + st.saved + '   Не успели: ' + st.lost + '   В очереди: ' + left);
      var t = Math.max(0, Math.ceil(s.timeLeft));
      s.timerT.setText(Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2));
      s.timerT.setColor(t <= 15 ? '#ff9b8a' : '#f6eedb');
      var f = Math.max(0, s.timeLeft / s.lz.duration);
      s.timerBar.clear(); s.timerBar.fillStyle(0x000000, 0.3); s.timerBar.fillRect(0, 60, W, 6);
      s.timerBar.fillStyle(t <= 15 ? C.red : C.amber, 1); s.timerBar.fillRect(0, 60, W * f, 6);
    },

    /* ----- аптечка ----- */
    buildKit: function () {
      var s = this, lz = s.lz, n = lz.kit.length;
      var g = s.add.graphics();
      g.fillStyle(0x6b4a2a, 0.92); g.fillRoundedRect(4, KIT_Y - 8, W - 8, H - KIT_Y + 4, 14);
      g.lineStyle(2, C.ink, 1); g.strokeRoundedRect(4, KIT_Y - 8, W - 8, H - KIT_Y + 4, 14);
      s.tiles = {};
      var tw = 118, th = 120, gap = 6;
      var rows = n <= 3 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
      var idx = 0;
      rows.forEach(function (cnt, r) {
        var rowW = cnt * tw + (cnt - 1) * gap, x0 = (W - rowW) / 2;
        for (var i = 0; i < cnt; i++) {
          var it = lz.kit[idx++];
          s.makeTile(it, x0 + i * (tw + gap) + tw / 2, KIT_Y + 6 + r * (th + gap) + th / 2, tw, th);
        }
      });
    },
    makeTile: function (it, cx, cy, tw, th) {
      var s = this;
      var c = s.add.container(cx, cy);
      var g = s.add.graphics();
      var ig = s.add.graphics();
      icon(ig, it.icon, 0, -24, 46);
      var nm = T(s, 0, 20, it.name, 14, hex(C.ink), { origin: [0.5, 0.5], align: 'center', wrap: tw - 10, bold: true, ls: 0 });
      var cnt = T(s, tw / 2 - 8, -th / 2 + 6, '', 15, '#f6eedb', { origin: [1, 0], bold: true });
      var cbg = s.add.graphics();
      c.add([g, ig, nm, cbg, cnt]);
      c.setSize(tw, th);
      c.setInteractive({ useHandCursor: true, draggable: true });
      var tile = { it: it, c: c, g: g, cnt: cnt, cbg: cbg, cx: cx, cy: cy, w: tw, h: th };
      tile.draw = function () {
        var left = s.stock[it.id], sel = s.selected === it.id, hl = tile.hl;
        g.clear();
        g.fillStyle(left > 0 ? C.card : 0xbfb39a, 1); g.fillRoundedRect(-tw / 2, -th / 2, tw, th, 10);
        g.lineStyle(sel || hl ? 4 : 2, sel || hl ? C.amber : C.ink, 1); g.strokeRoundedRect(-tw / 2, -th / 2, tw, th, 10);
        cbg.clear(); cbg.fillStyle(left > 0 ? C.red : 0x777777, 1);
        var label = left > 0 ? '×' + left : 'нет';
        cnt.setText(label);
        cbg.fillRoundedRect(tw / 2 - 12 - cnt.width, -th / 2 + 4, cnt.width + 8, 22, 6);
        c.setAlpha(left > 0 ? 1 : 0.6);
      };
      tile.draw();
      s.tiles[it.id] = tile;

      var lp = null;
      c.on('pointerdown', function () {
        tile.dragged = false; tile.long = false;
        if (lp) lp.remove();
        lp = s.time.delayedCall(480, function () { if (!tile.dragged) { tile.long = true; s.showTip(it); } });
      });
      c.on('pointerup', function () {
        if (lp) { lp.remove(); lp = null; }
        if (tile.dragged || tile.long) return;
        if (!s.kitEnabled()) return;
        s.selected = s.selected === it.id ? null : it.id;
        Object.keys(s.tiles).forEach(function (k) { s.tiles[k].draw(); });
        if (s.selected) s.setHint('Выбрано: ' + it.name + '. Теперь нажми на пациента.', C.ink);
      });
      c.on('pointerout', function () { if (lp && !tile.dragged) { /* оставляем таймер: палец мог чуть сдвинуться */ } });
      c.on('dragstart', function (p) {
        tile.dragged = true; if (lp) { lp.remove(); lp = null; }
        s.hideTip();
        if (!s.kitEnabled() || s.stock[it.id] <= 0) { tile.noDrag = true; if (s.stock[it.id] <= 0) s.setHint('Закончилось: ' + it.name, C.red); return; }
        tile.noDrag = false;
        var w = wpt(s, p);
        var gh = s.add.container(w.x, w.y).setDepth(800);
        var gg = s.add.graphics();
        gg.fillStyle(C.card, 0.95); gg.fillCircle(0, 0, 32); gg.lineStyle(3, C.amber, 1); gg.strokeCircle(0, 0, 32);
        icon(gg, it.icon, 0, 0, 40);
        gh.add(gg); tile.ghost = gh;
      });
      c.on('drag', function (p) {
        if (!tile.ghost) return;
        var w = wpt(s, p); tile.ghost.x = w.x; tile.ghost.y = w.y - 30;
        s.hoverAt(w.x, w.y - 30);
      });
      c.on('dragend', function (p) {
        if (!tile.ghost) return;
        var w = wpt(s, p);
        var gh = tile.ghost; tile.ghost = null; s.hoverAt(-1, -1);
        var target = s.patientAt(w.x, w.y - 30) || s.patientAt(w.x, w.y);
        if (target) { gh.destroy(); s.useItem(it.id, target); }
        else if (s.arrival && s.inRect(w.x, w.y - 30, s.arrival.rect())) { gh.destroy(); s.setHint('Сначала сортировка: перетащи раненого в зону.', C.red); }
        else s.tweens.add({ targets: gh, x: tile.cx, y: tile.cy, alpha: 0, duration: RM ? 1 : 200, onComplete: function () { gh.destroy(); } });
      });
    },
    kitEnabled: function () { return this.state === 'shift' || this.state === 'task'; },
    showTip: function (it) {
      var s = this; s.hideTip();
      var tile = s.tiles[it.id];
      var c = s.add.container(0, 0).setDepth(900);
      var hd = T(s, 0, 0, it.name, 16, hex(C.red), { bold: true });
      var t = T(s, 0, 0, it.tip, 15, hex(C.ink), { wrap: 330, ls: 2 });
      var bw = 350, bh = t.height + hd.height + 24, bx = (W - bw) / 2, by = KIT_Y - 16 - bh;
      var g = s.add.graphics();
      g.fillStyle(0xfbf6ea, 0.98); g.fillRoundedRect(bx, by, bw, bh, 10);
      g.lineStyle(2.5, C.amber, 1); g.strokeRoundedRect(bx, by, bw, bh, 10);
      var ax = Math.max(bx + 20, Math.min(bx + bw - 20, tile.cx));
      g.fillStyle(0xfbf6ea, 1); g.fillTriangle(ax - 10, by + bh - 1, ax + 10, by + bh - 1, ax, by + bh + 12);
      g.lineStyle(2.5, C.amber, 1); g.lineBetween(ax - 10, by + bh, ax, by + bh + 12); g.lineBetween(ax + 10, by + bh, ax, by + bh + 12);
      hd.setPosition(bx + 10, by + 8); t.setPosition(bx + 10, by + 12 + hd.height);
      c.add([g, hd, t]);
      s.tip = c;
      if (s.state === 'shift') s.tipTimer = s.time.delayedCall(3500, function () { s.hideTip(); });
      return c;
    },
    hideTip: function () { if (this.tip) { this.tip.destroy(); this.tip = null; } if (this.tipTimer) { this.tipTimer.remove(); this.tipTimer = null; } },

    /* ----- пациенты ----- */
    makePatient: function (q) {
      return { type: q.type, name: q.name, health: 100, step: 0, zone: this.lz.triage ? null : q.type.zone, triaged: !this.lz.triage, gone: false };
    },
    drawCard: function (p, x, y, w, h, compact) {
      var s = this, lz = s.lz;
      if (p.c) p.c.destroy();
      var c = s.add.container(x, y);
      var g = s.add.graphics();
      g.fillStyle(0x000000, 0.12); g.fillRoundedRect(3, 4, w, h, 12);
      g.fillStyle(C.card, 1); g.fillRoundedRect(0, 0, w, h, 12);
      var urgentLook = p.zone === 'urgent' || (!lz.triage && p.type.zone === 'urgent');
      g.lineStyle(2.5, urgentLook ? C.red : C.ink2, 1); g.strokeRoundedRect(0, 0, w, h, 12);
      var fg = s.add.graphics();
      var py = compact ? h / 2 : 50;
      fg.fillStyle(C.paper2, 1); fg.fillCircle(44, py, compact ? 28 : 34);
      figure(fg, 44, py + 2, lz.region, p.type.kind, false);
      var nm = T(s, 90, compact ? 8 : 10, p.name, 13, hex(C.ink2), { italic: true });
      var bd = T(s, 90, compact ? 26 : 28, p.type.badge, compact ? 16 : 18, hex(C.ink), { bold: true, wrap: w - 100, ls: 0 });
      var parts = [g, fg, nm, bd];
      var tag = null;
      var zoneName = null;
      if (lz.triage && p.zone) { lz.triage.forEach(function (z) { if (z.id === p.zone) zoneName = z.name; }); }
      else if (!lz.triage && p.type.zone === 'urgent') zoneName = 'Срочно';
      if (zoneName) {
        tag = T(s, w - 10, 8, zoneName.toUpperCase(), 11, '#f6eedb', { bold: true, origin: [1, 0] });
        var tg = s.add.graphics(); tg.fillStyle(p.zone === 'urgent' || (!lz.triage && p.type.zone === 'urgent') ? C.red : C.ink2, 1);
        tg.fillRoundedRect(w - 16 - tag.width, 5, tag.width + 12, 20, 6);
        parts.push(tg, tag);
        nm.setWordWrapWidth(w - 130);
      }
      if (compact && !p.triaged) {
        var tt = T(s, w - 10, h - 10, 'тяни в зону ▾', 13, hex(C.red), { bold: true, origin: [1, 1] });
        parts.push(tt);
      }
      var dots = null;
      if (!compact) {
        dots = s.add.graphics(); parts.push(dots);
      }
      var bar = s.add.graphics(); parts.push(bar);
      var flash = s.add.graphics(); flash.fillStyle(0xffffff, 1); flash.fillRoundedRect(0, 0, w, h, 12); flash.alpha = 0; parts.push(flash);
      c.add(parts);
      p.c = c; p.bar = bar; p.dots = dots; p.flash = flash; p.w = w; p.h = h; p.compact = compact;
      p.rect = function () { return { x: c.x, y: c.y, w: w, h: h }; };
      s.drawBar(p);
      if (compact && s.lz.triage && !p.triaged) {
        c.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, draggable: true, useHandCursor: true });
        s.bindArrivalDrag(p);
      } else if (!compact) {
        c.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
        c.on('pointerup', function () {
          if (s.selected && s.kitEnabled()) { var id = s.selected; s.selected = null; Object.keys(s.tiles).forEach(function (k) { s.tiles[k].draw(); }); s.useItem(id, p); }
        });
      }
      return c;
    },
    drawBar: function (p) {
      var w = p.w, h = p.h, bx = 90, bw = w - 104, by = p.compact ? h - 16 : h - 22;
      if (p.compact && !p.triaged) bw = w - 210;
      var col = p.health > 60 ? C.green : p.health > 30 ? C.amber : C.red;
      p.bar.clear();
      p.bar.fillStyle(0x000000, 0.15); p.bar.fillRoundedRect(bx, by, bw, 11, 5);
      p.bar.fillStyle(col, 1); p.bar.fillRoundedRect(bx, by, Math.max(4, bw * p.health / 100), 11, 5);
      p.bar.lineStyle(1.5, C.ink, 0.7); p.bar.strokeRoundedRect(bx, by, bw, 11, 5);
      if (p.dots) {
        p.dots.clear();
        var n = p.type.steps.length;
        for (var i = 0; i < n; i++) {
          p.dots.fillStyle(i < p.step ? C.green : 0xffffff, 1); p.dots.fillCircle(98 + i * 20, h - 36, 7);
          p.dots.lineStyle(2, C.ink, 0.8); p.dots.strokeCircle(98 + i * 20, h - 36, 7);
        }
      }
    },
    bedRect: function (i) { return { x: CARD_X, y: BED_Y[i], w: CARD_W, h: BED_H }; },
    inRect: function (x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; },
    patientAt: function (x, y) {
      for (var i = 0; i < 3; i++) { var p = this.beds[i]; if (p && !p.gone && this.inRect(x, y, p.rect())) return p; }
      return null;
    },
    hoverAt: function (x, y) {
      var s = this;
      for (var i = 0; i < 3; i++) {
        var p = s.beds[i]; if (!p || p.gone) continue;
        var on = s.inRect(x, y, p.rect());
        if (on !== !!p.hover) { p.hover = on; p.c.setScale(on && !RM ? 1.02 : 1); }
      }
    },
    placeInBed: function (p, i, instant) {
      var s = this;
      s.beds[i] = p; p.bed = i;
      var r = s.bedRect(i);
      s.drawCard(p, r.x, r.y, r.w, r.h, false);
      if (!instant && !RM) { p.c.x = -W; s.tweens.add({ targets: p.c, x: r.x, duration: 260, ease: 'Cubic.easeOut' }); }
    },
    freeBed: function () { for (var i = 0; i < 3; i++) if (!this.beds[i]) return i; return -1; },
    spawnArrival: function () {
      var s = this;
      var q = s.toSpawn.shift(); if (!q) return;
      var p = s.makePatient(q);
      s.arrival = p;
      if (!s.lz.triage) {
        var b = s.freeBed();
        if (b >= 0) { s.arrival = null; s.placeInBed(p, b); s.updateHeader(); return; }
      }
      s.drawCard(p, CARD_X, ARR_Y, CARD_W, ARR_H, true);
      if (!RM) { p.c.y = ARR_Y - 90; s.tweens.add({ targets: p.c, y: ARR_Y, duration: 260, ease: 'Back.easeOut' }); }
      if (s.lz.triage) s.setHint('Новый раненый — перетащи его в зону ▾', C.red, true);
      s.updateHeader();
    },

    /* ----- сортировка ----- */
    showZones: function (p) {
      var s = this; if (s.zonesC) return;
      var zs = s.lz.triage, n = zs.length;
      var c = s.add.container(0, 0).setDepth(600);
      var bg = s.add.graphics(); bg.fillStyle(0x2a1d12, 0.9); bg.fillRoundedRect(4, KIT_Y - 8, W - 8, H - KIT_Y + 4, 14);
      c.add(bg);
      s.zoneRects = [];
      var zw = (W - 24 - (n - 1) * 8) / n, zh = H - KIT_Y - 48;
      zs.forEach(function (z, i) {
        var x = 12 + i * (zw + 8), y = KIT_Y + 34;
        var g = s.add.graphics();
        var col = z.id === 'urgent' ? C.red : z.id === 'wait' ? C.amber : 0x55606a;
        g.fillStyle(col, 1); g.fillRoundedRect(x, y, zw, zh, 12);
        g.lineStyle(3, 0xf6eedb, 0.9); g.strokeRoundedRect(x, y, zw, zh, 12);
        var t1 = T(s, x + zw / 2, y + zh / 2 - 14, z.name, n > 2 ? 16 : 20, '#f6eedb', { bold: true, origin: [0.5, 0.5], align: 'center', wrap: zw - 8 });
        var t2 = T(s, x + zw / 2, y + zh / 2 + 18, z.sub, 13, '#f6eedb', { origin: [0.5, 0.5], align: 'center', wrap: zw - 10, italic: true });
        var hz = s.add.zone(x, y, zw, zh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        hz.on('pointerup', function () { if (s.arrival && !s.arrival.triaged && !s.arrDragging) s.triage(s.arrival, z.id); });
        c.add([g, t1, t2, hz]);
        s.zoneRects.push({ id: z.id, x: x, y: y, w: zw, h: zh, g: g });
      });
      // заголовок
      var head = T(s, W / 2, KIT_Y + 6, 'Сортировка: куда его?', 15, '#f6eedb', { origin: [0.5, 0], bold: true });
      c.add(head);
      s.zonesC = c;
    },
    hideZones: function () { if (this.zonesC) { this.zonesC.destroy(); this.zonesC = null; this.zoneRects = null; } },
    bindArrivalDrag: function (p) {
      var s = this, c = p.c;
      c.on('pointerup', function () { if (!s.arrDragging && s.state === 'shift') { if (s.zonesC) s.hideZones(); else s.showZones(p); } });
      c.on('dragstart', function () { if (s.state !== 'shift') return; s.arrDragging = true; s.showZones(p); c.setDepth(700); });
      c.on('drag', function (ptr) { if (!s.arrDragging) return; var w = wpt(s, ptr); c.x = w.x - p.w / 2; c.y = w.y - p.h / 2; });
      c.on('dragend', function (ptr) {
        if (!s.arrDragging) return;
        var w = wpt(s, ptr); s.time.delayedCall(30, function () { s.arrDragging = false; });
        var hit = null;
        (s.zoneRects || []).forEach(function (z) { if (s.inRect(w.x, w.y, z)) hit = z.id; });
        if (hit) s.triage(p, hit);
        else { s.tweens.add({ targets: c, x: CARD_X, y: ARR_Y, duration: RM ? 1 : 180 }); c.setDepth(0); }
      });
    },
    triage: function (p, zoneId) {
      var s = this;
      s.hideZones();
      p.triaged = true; p.zone = zoneId;
      s.stats.triAll++;
      var ok = zoneId === p.type.zone;
      if (ok) { s.stats.triOk++; s.float('Сортировка верна!', W / 2, ARR_Y + 36, C.green); s.setHint('Верно рассортирован.', C.green); }
      else {
        p.health = Math.max(5, p.health - 15);
        var msg = p.type.zone === 'urgent' ? 'Ошибка сортировки: ему нужна помощь срочно!' : p.type.zone === 'hopeless' ? 'Пирогов: сначала тех, кого можно спасти. Этому — облегчить страдания.' : 'Ошибка сортировки: он мог подождать — врачей на всех не хватает.';
        s.float('Неверно', W / 2, ARR_Y + 36, C.red);
        s.setHint(msg, C.red);
        s.mistakesFx(null);
      }
      if (p.c) { p.c.destroy(); p.c = null; }
      s.arrival = null;
      s.waitingTriaged = s.waitingTriaged || [];
      s.waitingTriaged.push(p);
      s.flushWaiting();
      s.updateHeader();
    },
    flushWaiting: function () {
      var s = this;
      while (s.waitingTriaged && s.waitingTriaged.length && s.freeBed() >= 0) {
        // срочных — первыми
        s.waitingTriaged.sort(function (a, b) { return (a.zone === 'urgent' ? 0 : 1) - (b.zone === 'urgent' ? 0 : 1); });
        s.placeInBed(s.waitingTriaged.shift(), s.freeBed());
      }
    },

    /* ----- лечение ----- */
    useItem: function (id, p) {
      var s = this;
      if (!p || p.gone) return false;
      var it = s.tiles[id].it;
      if (s.stock[id] <= 0) { s.setHint('Закончилось: ' + it.name, C.red); return false; }
      var st = p.type.steps[p.step];
      var ok = st && (st.item === id || (st.any && st.any.indexOf(id) >= 0));
      if (s.state === 'task' && !ok) { s.setHint(st.hint, C.red); s.mistakesFx(p); return false; }
      if (ok) {
        s.stock[id]--; s.tiles[id].draw();
        p.step++; p.health = Math.min(100, p.health + 30);
        s.flashCard(p, C.green);
        var r = p.rect();
        s.float('+ ' + it.name, r.x + r.w / 2, r.y + 30, C.green);
        s.drawBar(p);
        if (p.step >= p.type.steps.length) s.finish(p, true);
        else if (s.state === 'shift') s.setHint('Хорошо! Дальше: ещё ' + (p.type.steps.length - p.step) + ' шаг(а) для «' + p.name + '».', C.green);
        if (s.state === 'task') s.endTutorial();
        return true;
      }
      s.stats.mistakes++;
      p.health = Math.max(1, p.health - 12);
      s.drawBar(p);
      s.mistakesFx(p);
      s.setHint(it.name + ' — не то. ' + (st ? st.hint : ''), C.red);
      return false;
    },
    mistakesFx: function (p) {
      var s = this;
      if (p && p.c) {
        s.flashCard(p, C.red);
        if (!RM) { var x0 = p.rect().x; s.tweens.add({ targets: p.c, x: x0 + 7, duration: 45, yoyo: true, repeat: 3, onComplete: function () { if (p.c) p.c.x = x0; } }); }
      } else if (!RM) s.cameras.main.shake(140, 0.004);
    },
    flashCard: function (p, col) {
      var s = this; if (!p.flash) return;
      p.flash.clear(); p.flash.fillStyle(col, 1); p.flash.fillRoundedRect(0, 0, p.w, p.h, 12);
      p.flash.alpha = 0.55;
      s.tweens.add({ targets: p.flash, alpha: 0, duration: RM ? 300 : 500 });
    },
    float: function (txt, x, y, col) {
      var s = this;
      var t = T(s, x, y, txt, 18, hex(col), { bold: true, origin: [0.5, 0.5] }).setDepth(950);
      t.setStroke('#f6eedb', 4);
      s.tweens.add({ targets: t, y: y - (RM ? 0 : 36), alpha: 0, delay: 500, duration: 700, onComplete: function () { t.destroy(); } });
    },
    finish: function (p, ok) {
      var s = this;
      p.gone = true;
      if (ok) {
        if (p.type.zone === 'hopeless') s.stats.relieved++; else s.stats.saved++;
      } else s.stats.lost++;
      var r = p.rect();
      var bandG = s.add.graphics();
      bandG.fillStyle(ok ? C.green : 0x777777, 0.95); bandG.fillRoundedRect(0, r.h - 40, r.w, 40, { tl: 0, tr: 0, bl: 12, br: 12 });
      var msg = ok ? '✓ ' + p.type.done : (s.lz.goalWord === 'Остановлено' ? 'Не успели — болезнь пошла дальше' : 'Не успели помочь');
      var bt = T(s, r.w / 2, r.h - 20, msg, 14, '#ffffff', { bold: true, origin: [0.5, 0.5], align: 'center', wrap: r.w - 20 });
      p.c.add([bandG, bt]);
      if (!ok) { p.c.setAlpha(0.75); }
      var bed = p.bed;
      s.time.delayedCall(RM ? 900 : 1100, function () {
        s.tweens.add({
          targets: p.c, x: ok ? W + 20 : -W, alpha: ok ? 1 : 0, duration: RM ? 1 : 300, onComplete: function () {
            if (p.c) p.c.destroy(); p.c = null;
            if (s.beds[bed] === p) s.beds[bed] = null;
            s.flushWaiting();
            if (!s.lz.triage && s.arrival && s.freeBed() >= 0) { var a = s.arrival; s.arrival = null; if (a.c) { a.c.destroy(); a.c = null; } s.placeInBed(a, s.freeBed()); }
            s.updateHeader();
          }
        });
      });
      s.updateHeader();
      if (ok) s.setHint(p.name + ': ' + p.type.done, C.green);
    },
    setHint: function (txt, col, sticky) {
      var s = this;
      s.hint.setText(txt); s.hint.setColor(hex(col || C.ink));
      if (s.hintTimer) s.hintTimer.remove();
      if (!sticky) s.hintTimer = s.time.delayedCall(3800, function () { s.defaultHint(); });
    },
    defaultHint: function () {
      var s = this;
      if (s.state !== 'shift') return;
      if (s.arrival && s.lz.triage && !s.arrival.triaged) s.hint.setText('Новый раненый — перетащи его в зону ▾').setColor(hex(C.red));
      else s.hint.setText('Перетащи предмет на пациента · долгое нажатие — подсказка').setColor(hex(C.ink2));
    },

    /* ----- обучение ----- */
    startTutorial: function () {
      var s = this, m = s.lz.mentor;
      s.state = 'tutorial';
      s.tutLine = 0; s.tutSub = 0;
      s.blocker = s.add.zone(0, 0, W, H).setOrigin(0, 0).setInteractive().setDepth(850);
      s.blocker.on('pointerup', function () { s.tutNext(); });
      s.dlg = s.add.container(0, 0).setDepth(860);
      s.skipBtn = button(s, W - 74, 96, 128, 44, 'Пропустить', function () { s.skipTutorial(); }, { fill: C.paper2, color: hex(C.ink), size: 15 }).setDepth(870);
      s.hint.setText('');
      s.tutShow();
    },
    tutShow: function () {
      var s = this, m = s.lz.mentor, line = m.lines[s.tutLine];
      s.dlg.removeAll(true);
      s.hideTip();
      Object.keys(s.tiles).forEach(function (k) { s.tiles[k].hl = false; s.tiles[k].draw(); });
      var top = line.task ? 290 : 150;
      var g = s.add.graphics();
      g.fillStyle(0x000000, 0.15); g.fillRoundedRect(13, top + 4, W - 24, 200, 14);
      g.fillStyle(0xfbf6ea, 0.98); g.fillRoundedRect(10, top, W - 20, 200, 14);
      g.lineStyle(3, C.ink, 1); g.strokeRoundedRect(10, top, W - 20, 200, 14);
      mentorSil(g, 58, top + 56, m.silhouette);
      var nm = T(s, 106, top + 12, m.name, 15, hex(C.red), { bold: true, wrap: 160 });
      var tx = T(s, 106, top + 16 + nm.height + 4, line.t, 16, hex(C.ink), { wrap: W - 136, ls: 2 });
      var more = T(s, W - 24, top + 188, line.task ? 'перетащи предмет ▾' : 'нажми — дальше ▸', 13, hex(C.ink2), { italic: true, origin: [1, 1] });
      var stepT = T(s, 24, top + 188, (s.tutLine + 1) + ' / ' + m.lines.length, 13, hex(C.ink2), { origin: [0, 1] });
      s.dlg.add([g, nm, tx, more, stepT]);
      // если текст не влез — растянуть рамку
      var need = tx.y + tx.height + 30 - top;
      if (need !== 200) { need = Math.max(150, need); g.clear(); g.fillStyle(0xfbf6ea, 0.98); g.fillRoundedRect(10, top, W - 20, need, 14); g.lineStyle(3, C.ink, 1); g.strokeRoundedRect(10, top, W - 20, need, 14); mentorSil(g, 58, top + 56, m.silhouette); more.y = top + need - 12; stepT.y = top + need - 12; }
      if (line.items && line.items[s.tutSub]) {
        var tile = s.tiles[line.items[s.tutSub]];
        tile.hl = true; tile.draw();
        s.showTip(tile.it);
        if (!RM) { tile.c.setScale(1); s.tweens.add({ targets: tile.c, scale: 1.07, duration: 260, yoyo: true, repeat: 1 }); }
      }
      if (line.task) s.tutTask();
    },
    tutNext: function () {
      var s = this, m = s.lz.mentor, line = m.lines[s.tutLine];
      if (line.task) return;
      if (line.items && s.tutSub < line.items.length - 1) { s.tutSub++; s.tutShow(); return; }
      s.tutLine++; s.tutSub = 0;
      if (s.tutLine >= m.lines.length) { s.startShift(); return; }
      s.tutShow();
    },
    tutTask: function () {
      var s = this, m = s.lz.mentor;
      if (s.blocker) { s.blocker.destroy(); s.blocker = null; }
      s.state = 'task';
      var p = s.makePatient(s.queue[0]);
      p.triaged = true; p.zone = p.type.zone;
      s.placeInBed(p, 0, true);
      s.tutPatient = p;
      var tile = s.tiles[m.task.item];
      tile.hl = true; tile.draw();
      // рука-подсказка
      var hand = s.add.container(tile.cx, tile.cy).setDepth(880);
      var hg = s.add.graphics();
      hg.fillStyle(0xf3d2b0, 1); hg.lineStyle(2.5, C.ink, 1);
      hg.fillRoundedRect(-7, -26, 14, 30, 7); hg.strokeRoundedRect(-7, -26, 14, 30, 7);
      hg.fillRoundedRect(-14, 0, 30, 26, 9); hg.strokeRoundedRect(-14, 0, 30, 26, 9);
      hand.add(hg); s.hand = hand;
      var r = p.rect();
      if (!RM) {
        s.handTw = s.tweens.add({ targets: hand, x: r.x + r.w / 2, y: r.y + r.h / 2 + 10, duration: 1100, ease: 'Sine.easeInOut', repeat: -1, repeatDelay: 400, hold: 300 });
      } else { hand.setPosition(r.x + r.w / 2, r.y + r.h / 2 + 10); }
      s.setHint('Перетащи «' + tile.it.name + '» на раненого', C.red, true);
    },
    endTutorial: function () {
      var s = this, m = s.lz.mentor;
      if (s.hand) { s.hand.destroy(); s.hand = null; }
      Object.keys(s.tiles).forEach(function (k) { s.tiles[k].hl = false; s.tiles[k].draw(); });
      s.hideTip();
      s.state = 'praise';
      s.dlg.removeAll(true);
      var top = 290;
      var g = s.add.graphics();
      g.fillStyle(0xfbf6ea, 0.98); g.fillRoundedRect(10, top, W - 20, 150, 14);
      g.lineStyle(3, C.green, 1); g.strokeRoundedRect(10, top, W - 20, 150, 14);
      mentorSil(g, 58, top + 56, m.silhouette);
      var nm = T(s, 106, top + 12, m.name, 15, hex(C.green), { bold: true, wrap: 160 });
      var tx = T(s, 106, top + 16 + nm.height + 4, m.praise, 17, hex(C.ink), { wrap: W - 136, bold: true });
      s.dlg.add([g, nm, tx]);
      s.time.delayedCall(window.__test ? 300 : 2200, function () { s.startShift(); });
    },
    skipTutorial: function () {
      var s = this;
      if (s.state === 'shift') return;
      if (s.hand) { s.hand.destroy(); s.hand = null; }
      if (s.tutPatient) { s.startShift(); return; }
      s.startShift(true);
    },
    startShift: function (noTutPatient) {
      var s = this;
      if (s.state === 'shift') return;
      if (s.blocker) { s.blocker.destroy(); s.blocker = null; }
      if (s.dlg) s.dlg.destroy(); s.dlg = null;
      if (s.skipBtn) { s.skipBtn.destroy(); s.skipBtn = null; }
      if (s.hand) { s.hand.destroy(); s.hand = null; }
      s.hideTip();
      Object.keys(s.tiles).forEach(function (k) { s.tiles[k].hl = false; s.tiles[k].draw(); });
      if (noTutPatient && !s.tutPatient) { s.toSpawn = s.queue.slice(); }
      s.state = 'shift';
      s.spawnT = 0.4;
      try { PROG.tut = PROG.tut || {}; PROG.tut[s.lz.id] = 1; saveProg(PROG); } catch (e) {}
      var b = T(s, W / 2, 360, 'Смена началась!', 30, hex(C.red), { bold: true, origin: [0.5, 0.5] }).setDepth(990);
      b.setStroke('#fbf6ea', 6);
      s.tweens.add({ targets: b, alpha: 0, scale: RM ? 1 : 1.3, delay: 700, duration: 600, onComplete: function () { b.destroy(); } });
      s.defaultHint();
    },

    /* ----- цикл ----- */
    update: function (t, dtMs) {
      var s = this;
      if (s.state !== 'shift') return;
      var dt = dtMs / 1000 * s.speed;
      s.timeLeft -= dt;
      // спавн
      s.spawnT -= dt;
      var busy = s.beds.some(function (b) { return b && !b.gone; });
      if (!s.arrival && s.toSpawn.length && (s.spawnT <= 0 || !busy)) {
        if (s.lz.triage || s.freeBed() >= 0 || !busy) { s.spawnArrival(); s.spawnT = s.lz.spawnEvery; }
      }
      if (!s.lz.triage && s.arrival && s.freeBed() >= 0) { var a = s.arrival; s.arrival = null; if (a.c) { a.c.destroy(); a.c = null; } s.placeInBed(a, s.freeBed()); }
      // ухудшение
      var base = 100 / 42;
      var all = s.beds.slice(); if (s.arrival) all.push(s.arrival);
      (s.waitingTriaged || []).forEach(function (w) { all.push(w); });
      all.forEach(function (p) {
        if (!p || p.gone) return;
        var mult = p.type.drain;
        if (!p.triaged) mult *= 0.5;
        else if (s.lz.triage && p.zone === p.type.zone && p.zone !== 'urgent') mult *= 0.7;
        if (p.bed == null && p.triaged) mult *= 0.6;
        p.health -= base * mult * dt;
        if (p.health <= 0) {
          p.health = 0;
          if (p.bed != null && s.beds[p.bed] === p) { s.drawBar(p); s.finish(p, false); }
          else {
            p.gone = true; s.stats.lost++;
            if (p === s.arrival) { if (p.c) p.c.destroy(); s.arrival = null; s.hideZones(); }
            else s.waitingTriaged.splice(s.waitingTriaged.indexOf(p), 1);
            s.setHint(p.name + ' не дождался помощи.', C.red);
          }
        } else if (p.c) s.drawBar(p);
      });
      s.updateHeader();
      // конец смены
      var anyLeft = s.toSpawn.length || s.arrival || (s.waitingTriaged && s.waitingTriaged.length) || s.beds.some(function (b) { return b; });
      if (s.timeLeft <= 0 || !anyLeft) s.endShift();
    },
    endShift: function () {
      var s = this;
      if (s.state === 'over') return;
      s.state = 'over';
      var st = s.stats;
      var notDone = s.toSpawn.length + (s.arrival ? 1 : 0) + (s.waitingTriaged ? s.waitingTriaged.length : 0) + s.beds.filter(function (b) { return b && !b.gone; }).length;
      st.unfinished = notDone;
      var b = T(s, W / 2, 360, s.timeLeft <= 0 ? 'Смена окончена!' : 'Все приняты!', 30, hex(C.red), { bold: true, origin: [0.5, 0.5] }).setDepth(990);
      b.setStroke('#fbf6ea', 6);
      s.time.delayedCall(window.__test ? 200 : 1300, function () { s.scene.start('Result', { id: s.lz.id, stats: st }); });
    }
  });

  /* ================= RESULT ================= */
  var Result = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function Result() { Phaser.Scene.call(this, { key: 'Result' }); },
    create: function (data) {
      var s = this; setupCam(s); window.__scene = s;
      var lz = LZ[data.id], st = data.stats;
      s.lz = lz; s.stats = st;
      var ratio = st.total ? st.saved / st.total : 0;
      var stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
      s.starsN = stars;
      if (!PROG.stars[lz.id] || PROG.stars[lz.id] < stars) PROG.stars[lz.id] = stars;
      saveProg(PROG);
      T(s, W / 2, 34, 'Итог смены', 28, hex(C.red), { bold: true, origin: [0.5, 0.5] });
      T(s, W / 2, 64, lz.title + ' · ' + lz.yearLabel, 16, hex(C.ink2), { italic: true, origin: [0.5, 0.5] });
      var g = s.add.graphics();
      for (var i = 0; i < 3; i++) {
        (function (i) {
          var sg = s.add.graphics();
          star(sg, 0, 0, 24, i < stars);
          sg.setPosition(W / 2 - 64 + i * 64, 112);
          if (!RM) { sg.setScale(0); s.tweens.add({ targets: sg, scale: 1, delay: 200 + i * 220, duration: 380, ease: 'Back.easeOut' }); }
        })(i);
      }
      T(s, W / 2, 162, lz.goalWord + ': ' + st.saved + ' из ' + st.total, 25, hex(C.ink), { bold: true, origin: [0.5, 0.5] });
      var lines = [];
      if (st.triAll) lines.push('Сортировка: верно ' + st.triOk + ' из ' + st.triAll);
      if (st.relieved) lines.push('Безнадёжным облегчили страдания: ' + st.relieved);
      lines.push('Ошибок с аптечкой: ' + st.mistakes);
      var sub = T(s, W / 2, 190, lines.join('\n'), 15, hex(C.ink2), { origin: [0.5, 0], align: 'center' });
      var y = 196 + sub.height + 12;
      var cardTop = y;
      var cg = s.add.graphics();
      var hd = T(s, 26, y + 12, 'Как было на самом деле', 18, hex(C.red), { bold: true });
      y += 42;
      var size = 15;
      var factsT = T(s, 26, y, lz.facts.map(function (f) { return '• ' + f; }).join('\n'), size, hex(C.ink), { wrap: W - 52, ls: 3 });
      var srcT = T(s, 26, y + factsT.height + 10, 'Источник: ' + lz.sources.join(' '), 12, hex(C.ink2), { wrap: W - 52, italic: true });
      var bottom = srcT.y + srcT.height + 12;
      if (bottom > 740) {
        factsT.setFontSize(13); srcT.y = factsT.y + factsT.height + 8; bottom = srcT.y + srcT.height + 12;
      }
      cg.fillStyle(C.card, 0.95); cg.fillRoundedRect(12, cardTop, W - 24, bottom - cardTop, 12);
      cg.lineStyle(2, C.ink2, 0.8); cg.strokeRoundedRect(12, cardTop, W - 24, bottom - cardTop, 12);
      button(s, 108, 800, 180, 54, '← На карту', function () { PROG.year = lz.mapYear; saveProg(PROG); s.scene.start('Map'); }, { size: 17 });
      button(s, 290, 800, 170, 54, 'Ещё раз', function () { s.scene.start('Ward', { id: lz.id }); }, { fill: C.paper2, color: hex(C.ink), size: 17 });
    }
  });

  /* ================= ABOUT ================= */
  var About = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function About() { Phaser.Scene.call(this, { key: 'About' }); },
    create: function () {
      var s = this; setupCam(s); window.__scene = s;
      T(s, W / 2, 40, 'Об игре', 30, hex(C.red), { bold: true, origin: [0.5, 0.5] });
      var y = 80;
      D.about.forEach(function (p) { var t = T(s, 24, y, p, 16, hex(C.ink), { wrap: W - 48, ls: 3 }); y += t.height + 14; });
      var hd = T(s, 24, y, 'Лазареты в игре', 18, hex(C.red), { bold: true }); y += 30;
      var lst = T(s, 24, y, D.lazarets.map(function (l) { return (PROG.stars[l.id] ? '★ ' : '· ') + D.regions[l.region].name + ', ' + l.yearLabel + ' — ' + l.title; }).join('\n'), 15, hex(C.ink), { wrap: W - 48, ls: 4 });
      y += lst.height + 18;
      button(s, W / 2, Math.max(y + 30, 790), 220, 52, '← На карту', function () { s.scene.start('Map'); }, { size: 17 });
    }
  });

  /* ================= ЗАПУСК ================= */
  var game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#2b2118',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: Math.round(W * Z), height: Math.round(H * Z) },
    input: { activePointers: 2 },
    render: { antialias: true, roundPixels: false },
    banner: false,
    scene: [Boot, MapScene, Brief, Ward, Result, About]
  });
  window.__game = game;

  /* ================= ТЕСТОВЫЙ ХУК ================= */
  window.__test = window.__test || null;
  window.__testApi = {
    scene: function () { var s = window.__scene; return s ? s.scene.key : null; },
    setYear: function (y) { var s = window.__scene; if (s && s.setYear) s.setYear(y, true); },
    tapRegion: function (r) { var s = window.__scene; if (s && s.tapRegion) s.tapRegion(r); },
    go: function (scene, data) { window.__scene.scene.start(scene, data); },
    ward: function () { var s = window.__scene; return s && s.scene.key === 'Ward' ? s : null; },
    state: function () {
      var s = window.__scene; if (!s) return null;
      var o = { scene: s.scene.key };
      if (s.scene.key === 'Ward') {
        o.state = s.state; o.stats = s.stats; o.time = s.timeLeft; o.toSpawn = s.toSpawn.length;
        o.beds = s.beds.map(function (p) { return p ? { name: p.name, badge: p.type.badge, step: p.step, health: Math.round(p.health) } : null; });
        o.arrival = s.arrival ? s.arrival.type.badge : null; o.stock = s.stock; o.tutLine = s.tutLine;
      }
      if (s.scene.key === 'Result') { o.stats = s.stats; o.stars = s.starsN; }
      return o;
    },
    tutNext: function () { var s = this.ward(); if (s) s.tutNext(); },
    /* один «правильный» ход: обучение → сортировка → лечение */
    autoStep: function () {
      var s = this.ward(); if (!s) return 'no-ward';
      if (s.state === 'tutorial') { s.tutNext(); return 'tut'; }
      if (s.state === 'task') { s.useItem(s.lz.mentor.task.item, s.tutPatient); return 'task'; }
      if (s.state !== 'shift') return s.state;
      if (s.arrival && s.lz.triage && !s.arrival.triaged) { s.triage(s.arrival, s.arrival.type.zone); return 'triage'; }
      for (var i = 0; i < 3; i++) {
        var p = s.beds[i];
        if (p && !p.gone) {
          var st = p.type.steps[p.step];
          var id = st.item || st.any.filter(function (x) { return s.stock[x] > 0; })[0] || st.any[0];
          s.useItem(id, p); return 'treat';
        }
      }
      return 'idle';
    },
    wrong: function () {
      var s = this.ward(); if (!s) return;
      for (var i = 0; i < 3; i++) {
        var p = s.beds[i];
        if (p && !p.gone) {
          var st = p.type.steps[p.step];
          var bad = s.lz.kit.filter(function (k) { return k.id !== st.item && !(st.any && st.any.indexOf(k.id) >= 0) && s.stock[k.id] > 0; })[0];
          if (bad) { s.useItem(bad.id, p); return bad.id; }
        }
      }
    },
    tileCenter: function (id) { var s = this.ward(); var t = s.tiles[id]; return { x: t.cx, y: t.cy }; },
    zoom: Z, W: W, H: H
  };
})();
