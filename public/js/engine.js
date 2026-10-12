/* Mesin objek 3D perhiasan: CSS 3D murni, tanpa library.
   Tiap perhiasan disusun dari facet/elemen kecil yang warnanya dihitung ulang
   dari arah cahaya saat objek diputar, jadi kilau emas bergerak mengikuti mouse. */
(function () {
'use strict';
var D2R = Math.PI / 180;
var TONE = {
  kuning: { d: [92, 58, 5], m: [204, 150, 28], l: [255, 241, 178] },
  rose:   { d: [92, 42, 34], m: [205, 126, 102], l: [255, 220, 202] },
  putih:  { d: [58, 63, 72], m: [172, 180, 193], l: [255, 255, 255] }
};
var GEM = {
  diamond:  { d: [110, 134, 170], l: [255, 255, 255] },
  ruby:     { d: [64, 0, 14],  l: [255, 96, 122] },
  sapphire: { d: [6, 22, 84],  l: [112, 170, 255] },
  emerald:  { d: [0, 56, 28],  l: [120, 234, 170] }
};
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function metal(tone, t) { var P = TONE[tone]; t = clamp(t, 0, 1); return rgb(t < 0.5 ? mix(P.d, P.m, t * 2) : mix(P.m, P.l, (t - 0.5) * 2)); }
function gemCol(type, t) { var G = GEM[type]; return rgb(mix(G.d, G.l, clamp(t, 0, 1))); }
function f2(n) { return n.toFixed(2); }

/* ---------- elemen dasar ---------- */
function E(o) {
  var w = o.w, h = o.h;
  return '<div class="e' + (o.cls ? ' ' + o.cls : '') + '"' +
    (o.n ? ' data-n="' + o.n[0].toFixed(3) + ',' + o.n[1].toFixed(3) + ',' + o.n[2].toFixed(3) + '"' : '') +
    (o.m ? ' data-m="' + o.m + '"' : '') +
    (o.k !== undefined ? ' data-k="' + o.k + '"' : '') +
    ' style="width:' + f2(w) + 'px;height:' + f2(h) + 'px;margin:' + f2(-h / 2) + 'px 0 0 ' + f2(-w / 2) + 'px;transform:' + o.tf + ';' + (o.st || '') + '">' +
    (o.html || '') + '</div>';
}

/* cincin: pita silinder dengan sumbu Z (lubang menghadap penonton) */
function ring(o) {
  var N = o.N, R = o.R, t = o.t, b = o.b, s = '', i, a, rad;
  [R, R - t].forEach(function (rr) {
    for (i = 0; i < N; i++) {
      a = i * 360 / N; rad = a * D2R;
      s += E({ w: 2 * Math.PI * rr / N + 1.6, h: b, m: 'm',
        tf: 'rotateZ(' + a + 'deg) translateY(' + (-rr) + 'px) rotateX(90deg)',
        n: [Math.sin(rad), -Math.cos(rad), 0] });
    }
  });
  [b / 2, -b / 2].forEach(function (z) {
    for (i = 0; i < N; i++) {
      a = i * 360 / N;
      s += E({ w: 2 * Math.PI * (R - t / 2) / N + 1.6, h: t + 0.6, m: 'm',
        tf: 'translateZ(' + z + 'px) rotateZ(' + a + 'deg) translateY(' + (-(R - t / 2)) + 'px)',
        n: [0, 0, z > 0 ? 1 : -1] });
    }
  });
  return s;
}

/* tabung melingkar (bangle, anting hoop): bidang bersilang bergradien */
function tube(o) {
  var s = '', pre = o.pre || '', pl = o.planes || [0, 90], i, a;
  for (i = 0; i < o.N; i++) {
    a = i * 360 / o.N;
    pl.forEach(function (j) {
      s += E({ w: 2 * Math.PI * o.R / o.N + 1.6, h: o.d, cls: 'tb',
        tf: pre + 'rotateZ(' + a + 'deg) translateY(' + (-o.R) + 'px) rotateX(' + j + 'deg)' });
    });
  }
  return s;
}

/* batu permata: 8 sisi mahkota + 8 sisi pavilion + meja segi delapan */
function rotX(n, deg) {
  var c = Math.cos(deg * D2R), s = Math.sin(deg * D2R);
  return [n[0], n[1] * c - n[2] * s, n[1] * s + n[2] * c];
}
function gem(o) {
  var r = o.r, hc = o.hc, hp = o.hp, ta = o.ta || 0.56, a = r * Math.cos(Math.PI / 8), eb = 2 * a * Math.tan(Math.PI / 8);
  var pre = o.pre || '', rx = o.rotX || 0, s = '', k, ang, sn, cs, n;
  var runC = a * (1 - ta), Lc = Math.sqrt(hc * hc + runC * runC), phi = Math.atan2(runC, hc) / D2R;
  var Lp = Math.sqrt(hp * hp + a * a), th = Math.atan2(a, hp) / D2R;
  var x1 = (1 - ta) / 2 * 100, clipC = 'clip-path:polygon(' + x1.toFixed(1) + '% 0,' + (100 - x1).toFixed(1) + '% 0,100% 100%,0 100%)';
  for (k = 0; k < 8; k++) {
    ang = k * 45; sn = Math.sin(ang * D2R); cs = Math.cos(ang * D2R);
    n = rotX([sn * hc / Lc, -runC / Lc, cs * hc / Lc], rx);
    s += E({ w: eb, h: Lc, cls: 'gf', m: 'g:' + o.type, k: k, n: n, st: clipC,
      tf: pre + 'rotateY(' + ang + 'deg) translateZ(' + f2(a) + 'px) rotateX(' + f2(phi) + 'deg) translateY(' + f2(-Lc / 2) + 'px)' });
    n = rotX([sn * hp / Lp, a / Lp, cs * hp / Lp], rx);
    s += E({ w: eb, h: Lp, cls: 'gf', m: 'g:' + o.type, k: k + 8, n: n, st: 'clip-path:polygon(0 0,100% 0,50% 100%)',
      tf: pre + 'rotateY(' + ang + 'deg) translateZ(' + f2(a) + 'px) rotateX(' + f2(-th) + 'deg) translateY(' + f2(Lp / 2) + 'px)' });
  }
  var tw = 2 * ta * r, pts = [], i, psi;
  for (i = 0; i < 8; i++) {
    psi = (22.5 + 45 * i) * D2R;
    pts.push((50 + 50 * Math.sin(psi)).toFixed(1) + '% ' + (50 + 50 * Math.cos(psi)).toFixed(1) + '%');
  }
  s += E({ w: tw, h: tw, cls: 'gf', m: 'g:' + o.type, k: 99, n: rotX([0, -1, 0], rx), st: 'clip-path:polygon(' + pts.join(',') + ')',
    tf: pre + 'translateY(' + f2(-hc) + 'px) rotateX(90deg)' });
  return s;
}

/* cakram berlapis: koin, medali, liontin hati */
var HEART = (function () {
  var p = [], i, t, x, y, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for (i = 0; i < 56; i++) {
    t = i / 56 * 2 * Math.PI;
    x = 16 * Math.pow(Math.sin(t), 3);
    y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    p.push([x, y]); minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
  }
  return p.map(function (q) { return ((q[0] - minx) / (maxx - minx) * 100).toFixed(1) + '% ' + ((q[1] - miny) / (maxy - miny) * 100).toFixed(1) + '%'; }).join(',');
})();
function disc(o) {
  var sz = o.size, T = o.th || 8, s = '', i, pre = o.pre || '';
  var shape = o.shape === 'heart' ? 'clip-path:polygon(' + HEART + ');' : 'border-radius:50%;';
  for (i = T; i >= 1; i--) {
    s += E({ w: sz, h: sz, cls: 'dk', tf: pre + 'translateZ(' + (-i * 1.3) + 'px)', st: shape + 'background:' + (i % 2 ? 'var(--g1)' : 'var(--g2)') });
  }
  s += E({ w: sz, h: sz, cls: 'df', tf: pre + 'translateZ(0px)', st: shape, html: o.html || '' });
  return s;
}

/* rantai: mata rantai berselang-seling sepanjang jalur */
function resample(pts, sp, closed) {
  var tot = [0], i, out = [], L, n, j = 1, k, d, seg, t, x, y, ang;
  for (i = 1; i < pts.length; i++) tot.push(tot[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  L = tot[tot.length - 1]; n = Math.max(2, Math.round(L / sp));
  for (k = 0; k <= (closed ? n - 1 : n); k++) {
    d = L * k / n;
    while (j < pts.length - 1 && tot[j] < d) j++;
    seg = (tot[j] - tot[j - 1]) || 1; t = (d - tot[j - 1]) / seg;
    x = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t;
    y = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t;
    ang = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]) / D2R;
    out.push({ x: x, y: y, a: ang });
  }
  return out;
}
function chain(pts, o) {
  var res = resample(pts, o.sp, o.closed), s = '', i, p;
  for (i = 0; i < res.length; i++) {
    p = res[i];
    s += E({ w: o.lw, h: o.lh, cls: 'lk', st: 'border-width:' + o.bw + 'px',
      tf: 'translate3d(' + f2(p.x) + 'px,' + f2(p.y) + 'px,0) rotateZ(' + f2(p.a) + 'deg) rotateY(' + (i % 2 ? 74 : 0) + 'deg)' });
  }
  return s;
}
function beads(o) {
  var s = '', i, a;
  for (i = 0; i < o.n; i++) {
    a = i * 360 / o.n;
    ['', 'rotateX(90deg)', 'rotateY(90deg)'].forEach(function (r) {
      s += E({ w: o.d, h: o.d, cls: 'bd', tf: 'rotateZ(' + a + 'deg) translateY(' + (-o.R) + 'px) ' + r });
    });
  }
  return s;
}

/* ---------- rakitan per jenis ---------- */
function buildScene(m, lod) {
  var s = '', base = { rx: -18, ry: -30 }, sc = 1.4, N, i, pts, t, g, yb;
  switch (m.kind) {
    case 'ring':
      N = lod ? 26 : 40;
      s = ring({ N: N, R: m.R, t: m.t, b: m.b });
      if (m.gem) {
        g = m.gem;
        s += gem({ type: g.type, r: g.r, hc: g.hc, hp: g.hp, pre: 'translate3d(0,' + (-m.R - g.hp * 0.55) + 'px,0) ' });
      }
      base = { rx: -16, ry: -34 }; sc = 1.55;
      break;
    case 'tube':
      s = tube({ N: lod ? 30 : 48, R: m.R, d: m.d, planes: [0, 45, 90, 135] });
      base = { rx: -56, ry: -18 }; sc = 1.5;
      break;
    case 'chainC':
      pts = [];
      for (i = 0; i <= 120; i++) { t = i / 120 * 2 * Math.PI; pts.push([Math.sin(t) * m.R, -Math.cos(t) * m.R]); }
      s = chain(pts, { sp: m.sp || 12, lw: 16, lh: 10, bw: 3, closed: true });
      base = { rx: -56, ry: -18 }; sc = 1.5;
      break;
    case 'beads':
      s = beads({ n: m.n, R: m.R, d: m.d }) + tube({ N: 28, R: m.R, d: 3, planes: [0, 90] });
      base = { rx: -56, ry: -18 }; sc = 1.5;
      break;
    case 'chainU':
      pts = []; yb = 62;
      for (i = 0; i <= 90; i++) { t = i / 90; pts.push([(t - 0.5) * 2 * 64, -50 + 112 * (1 - Math.pow(2 * t - 1, 2))]); }
      s = chain(pts, { sp: m.sp || 10, lw: 13, lh: 8, bw: 2.4 });
      s += E({ w: 10, h: 15, cls: 'lk', st: 'border-width:2px', tf: 'translate3d(0,' + (yb + 3) + 'px,0)' });
      if (m.pend === 'heart') {
        s += disc({ size: 50, shape: 'heart', th: 7, pre: 'translate3d(0,' + (yb + 36) + 'px,0) ', html: '<i class="hl"></i>' });
      } else if (m.pend === 'coin') {
        s += disc({ size: 44, th: 7, pre: 'translate3d(0,' + (yb + 33) + 'px,0) ', html: '<i class="ring-in"></i><b class="coin-t">24K</b>' });
      }
      base = { rx: -8, ry: -18 }; sc = 1.4;
      break;
    case 'hoops':
      s = tube({ N: lod ? 22 : 30, R: 24, d: 5, planes: [0, 60, 120], pre: 'translate3d(-40px,0,0) ' }) +
          tube({ N: lod ? 22 : 30, R: 24, d: 5, planes: [0, 60, 120], pre: 'translate3d(40px,0,0) ' });
      base = { rx: -10, ry: -28 }; sc = 2.1;
      break;
    case 'studs':
      [-36, 36].forEach(function (x) {
        s += disc({ size: 40, th: 6, pre: 'translate3d(' + x + 'px,0,-4px) ' });
        s += gem({ type: m.gem, r: 13, hc: 6, hp: 10, rotX: -90, pre: 'translate3d(' + x + 'px,0,2px) rotateX(-90deg) ' });
      });
      base = { rx: -12, ry: -26 }; sc = 2.1;
      break;
    case 'disc':
      s = disc({ size: 116, th: 9, pre: 'translate3d(0,6px,0) ', html: '<i class="ros"></i><i class="ring-in"></i>' }) +
          E({ w: 12, h: 18, cls: 'lk', st: 'border-width:2.5px', tf: 'translate3d(0,-60px,0)' });
      base = { rx: -10, ry: -26 }; sc = 1.35;
      break;
  }
  return { html: s, base: base, sc: sc };
}

/* ---------- pencahayaan ---------- */
function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
var LIGHT = norm([-0.5, -0.6, 0.65]);
var HV = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);
function lum(n, rx, ry) {
  var cy = Math.cos(ry * D2R), sy = Math.sin(ry * D2R), cx = Math.cos(rx * D2R), sx = Math.sin(rx * D2R);
  var x1 = n[0] * cy + n[2] * sy, z1 = -n[0] * sy + n[2] * cy, y1 = n[1];
  var v = [x1, y1 * cx - z1 * sx, y1 * sx + z1 * cx];
  if (v[2] < 0) v = [-v[0], -v[1], -v[2]];
  var d = Math.max(0, v[0] * LIGHT[0] + v[1] * LIGHT[1] + v[2] * LIGHT[2]);
  var h = Math.max(0, v[0] * HV[0] + v[1] * HV[1] + v[2] * HV[2]);
  return { d: d, sp: Math.pow(h, 26), v: v };
}

/* ---------- objek hidup ---------- */
var act = [], raf = 0;
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function tick(t) {
  var again = false, i;
  raf = 0;
  for (i = 0; i < act.length; i++) { act[i].step(t); if (act[i].alive) again = true; }
  act = act.filter(function (S) { return S.alive; });
  if (again) raf = requestAnimationFrame(tick);
}
function wake(S) {
  S.alive = true;
  if (act.indexOf(S) < 0) act.push(S);
  if (!raf) raf = requestAnimationFrame(tick);
}

function make(host, m, opt) {
  opt = opt || {};
  var sc = buildScene(m, opt.lod), tone = m.tone || 'kuning', T = TONE[tone];
  host.innerHTML = '<div class="obj"><div class="sc" style="--g1:' + rgb(T.d) + ';--g2:' + rgb(T.m) + ';--g3:' + rgb(T.l) + '">' + sc.html + '</div></div>';
  var obj = host.firstChild;
  var items = [].slice.call(host.querySelectorAll('[data-n]')).map(function (el) {
    return { el: el, n: el.dataset.n.split(',').map(Number), m: el.dataset.m, k: +el.dataset.k || 0 };
  });
  var S = {
    host: host, base: sc.base, rx: sc.base.rx, ry: sc.base.ry, tgtX: sc.base.rx, tgtY: sc.base.ry,
        mode: 'rest', yaw: opt.yaw || 70, pitch: opt.pitch || 26, scale: (opt.scale || 1) * sc.sc, alive: false,
    zm: 1, zt: 1, vx: 0, vy: 0, dragging: false, lastT: 0
  };
  S.apply = function () {
    obj.style.transform = 'rotateX(' + S.rx.toFixed(2) + 'deg) rotateY(' + S.ry.toFixed(2) + 'deg) scale(' + (S.scale * S.zm).toFixed(3) + ')'
    var i, it, L, tt;
    for (i = 0; i < items.length; i++) {
      it = items[i]; L = lum(it.n, S.rx, S.ry);
      if (it.m === 'm') {
        tt = 0.14 + 0.5 * L.d + 0.85 * L.sp + 0.1 * Math.sin(L.v[0] * 6 + L.v[1] * 4);
        it.el.style.backgroundColor = metal(tone, tt);
      } else {
        tt = 0.1 + 0.62 * L.d * ((it.k & 1) ? 1 : 0.78) + 1.0 * L.sp;
        it.el.style.backgroundColor = gemCol(it.m.slice(2), tt);
      }
    }
  };
    S.step = function (t) {
    var lim = function (x) { return Math.max(S.base.rx - 85, Math.min(S.base.rx + 85, x)); };
    if (S.mode === 'idle') { S.tgtY = S.base.ry + Math.sin(t / 1700) * 24; S.tgtX = S.base.rx + Math.sin(t / 2300) * 6; }
    else if (S.mode === 'rest') { S.tgtY = S.base.ry; S.tgtX = S.base.rx; }
    else if (S.mode === 'free' && !S.dragging) {
      S.tgtY += S.vy; S.tgtX = lim(S.tgtX + S.vx); S.vy *= 0.94; S.vx *= 0.94;
      if (Math.abs(S.vy) < 0.02) S.vy = 0;
      if (Math.abs(S.vx) < 0.02) S.vx = 0;
    }
    var k = reduce ? 1 : 0.16;
    S.rx += (S.tgtX - S.rx) * k; S.ry += (S.tgtY - S.ry) * k; S.zm += (S.zt - S.zm) * k;
    S.apply();
    S.alive = S.mode === 'idle' || S.dragging || S.vx !== 0 || S.vy !== 0 || Math.abs(S.tgtX - S.rx) > 0.05 || Math.abs(S.tgtY - S.ry) > 0.05 || Math.abs(S.zt - S.zm) > 0.002;
  };
  /* putaran penuh: ambil sudut terdekat dari posisi awal supaya tidak berputar balik berkali-kali */
  S.unwind = function () {
    var d = ((S.ry - S.base.ry) % 360 + 540) % 360 - 180;
    S.ry = S.base.ry + d; S.tgtY = S.base.ry;
  };
  /* seret mouse: putar bebas 360° dengan inersia */
  S.dragStart = function () { S.mode = 'free'; S.dragging = true; S.vx = 0; S.vy = 0; wake(S); };
  S.dragBy = function (dx, dy) {
    var lim = function (x) { return Math.max(S.base.rx - 85, Math.min(S.base.rx + 85, x)); };
    S.tgtY += dx * 0.7; S.tgtX = lim(S.tgtX - dy * 0.5);
    S.vy = dx * 0.7; S.vx = -dy * 0.5; S.lastT = performance.now(); wake(S);
  };
  S.dragEnd = function () {
    S.dragging = false;
    if (reduce || performance.now() - S.lastT > 80) { S.vx = 0; S.vy = 0; }
    wake(S);
  };
  S.zoomTo = function (z) { S.zt = Math.max(0.6, Math.min(2.4, z)); wake(S); };
  S.zoomBy = function (f) { S.zoomTo(S.zt * f); };
  S.reset = function () { S.vx = 0; S.vy = 0; S.zt = 1; S.unwind(); S.mode = 'rest'; wake(S); };
  /* nx, ny: posisi mouse relatif terhadap pusat, -0.5 sampai 0.5 */
  S.follow = function (nx, ny) {
    S.mode = 'follow';
    S.tgtY = S.base.ry + nx * S.yaw;
    S.tgtX = S.base.rx - ny * S.pitch;
    wake(S);
  };
    S.rest = function () { if (S.mode === 'free') S.unwind(); S.mode = 'rest'; wake(S); };
  S.idle = function () { if (reduce) { S.rest(); return; } if (S.mode === 'free') S.unwind(); S.mode = 'idle'; wake(S); };
  S.destroy = function () { S.alive = false; act = act.filter(function (x) { return x !== S; }); };
  S.apply();
  return S;
}

window.GOLD3D = { make: make, TONE: TONE, metal: metal };
})();
