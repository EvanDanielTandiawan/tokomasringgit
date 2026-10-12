(function () {
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const dot = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const rp = n => 'Rp' + dot(n);
const usd = n => 'US$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const gr = n => String(+(+n).toFixed(2)).replace('.', ',') + ' g';
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HRI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const today = new Date(); today.setHours(12, 0, 0, 0);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fdate = d => d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear();
const fymd = s => fdate(new Date(s + 'T12:00:00'));
const nextOpen = d => { let x = new Date(d); while (x.getDay() === 0) x = addDays(x, 1); return x; };
function rng(seed) { let s = seed % 2147483646 + 1; return () => { s = s * 16807 % 2147483647; return s / 2147483647; }; }

/* ---------- Data ---------- */
const KARAT = [
  { k: '24K', kadar: 99.9, st: '999' }, { k: '22K', kadar: 91.6, st: '916' }, { k: '18K', kadar: 75, st: '750' },
  { k: '17K', kadar: 70.8, st: '708' }, { k: '16K', kadar: 66.7, st: '667' }, { k: '9K', kadar: 37.5, st: '375' }
];
const kInfo = k => KARAT.find(x => x.k === k);
const params = { acuan: 2450000, potong: 7, kurs: 16400 };
const gramJual = k => params.acuan * kInfo(k).kadar / 99.9;
const gramTrade = k => gramJual(k) * (1 - params.potong / 100);
const emasP = p => Math.round(p.berat * gramJual(p.karat) / 1000) * 1000;
const hargaP = p => emasP(p) + p.ongkos + p.batu;
const JN = { cincin: 'Cincin', kalung: 'Kalung', gelang: 'Gelang', anting: 'Anting', liontin: 'Liontin' };
const DEF = {
  cincin: { kind: 'ring', R: 46, b: 16, t: 5.5 }, kalung: { kind: 'chainU' }, gelang: { kind: 'tube', R: 60, d: 12 },
  anting: { kind: 'hoops' }, liontin: { kind: 'disc' }
};
const HERO = { kind: 'ring', R: 46, b: 16, t: 6, gem: { type: 'diamond', r: 20, hc: 11, hp: 17 }, tone: 'kuning' };
let P = [];
const prod = id => P.find(p => p.id === id);
const pname = id => (prod(id) || { nama: '(produk tidak tersedia)' }).nama;

/* ---------- State ---------- */
const S = {
  user: null, staff: false, view: 'katalog', stab: 'dash', wish: {}, pending: null,
  jenis: 'semua', karat: 'semua', sort: 'def', q: '', addOpen: false, delConfirm: null,
  apptProduk: '', tradeTarget: '', authTab: 'masuk', curId: null
};
S.appts = []; S.trade = []; S.trx = [];
let XAU = [];
let SCS = [];

/* ---------- Server ---------- */
/* Teks dari database ditampilkan lewat innerHTML, jadi di-escape sekali saat data masuk. */
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cl = (o, ks) => { ks.forEach(k => { if (typeof o[k] === 'string') o[k] = esc(o[k]); }); return o; };
const cP = p => cl(p, ['nama', 'kode', 'desc']), cN = o => cl(o, ['nama']);
let CSRF = (document.querySelector('meta[name="csrf-token"]') || {}).content || '';
async function api(method, url, body) {
  try {
    const res = await fetch(url, { method: method, credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF, 'X-Requested-With': 'XMLHttpRequest' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    let data = null; try { data = await res.json(); } catch (e) {}
    if (data && data.csrf) CSRF = data.csrf;
    if (res.status === 419) return { ok: false, status: 419, message: 'Sesi habis. Muat ulang halaman lalu coba lagi.' };
    if (res.status === 429) return { ok: false, status: 429, message: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' };
    return { ok: res.ok, status: res.status, data: data, message: (data && data.message) || (res.ok ? '' : 'Terjadi kesalahan. Coba lagi.') };
  } catch (e) { return { ok: false, status: 0, message: 'Tidak dapat terhubung ke server.' }; }
}
async function loadAll() {
  const r = await api('GET', '/api/bootstrap');
  if (!r.ok) { toast(r.message); return false; }
  const d = r.data;
  Object.assign(params, d.params);
  P = d.produk.map(cP);
  S.user = d.user && d.user.role === 'pelanggan' ? { nama: esc(d.user.nama), email: d.user.email } : null;
  S.staff = !!(d.user && d.user.role !== 'pelanggan');
  S.wish = {}; d.wish.forEach(id => { S.wish[id] = true; });
  S.appts = d.janji.map(cN); S.trade = d.trade.map(cN); S.trx = d.trx.map(cN);
  XAU = d.xau.map(x => ({ d: new Date(x.d + 'T12:00:00'), v: x.v }));
  return true;
}

/* ---------- Pelengkap tampilan ---------- */
const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.7 3.6 4.5 6.9 4.5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.300 0 5.300 3.200 4.100 6.700C19.500 15.900 12 20.500 12 20.500z"/></svg>';
const hall = (st, k) => '<svg class="hall" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="2.5"/><circle cx="50" cy="50" r="39" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3"/><text x="50" y="58" text-anchor="middle" font-family="Bodoni Moda,Georgia,serif" font-weight="700" font-size="30" fill="currentColor">' + st + '</text><text x="50" y="75" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="11" letter-spacing="2" fill="currentColor">' + k + '</text></svg>';
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function killScenes() { SCS.forEach(s => s.destroy()); SCS = []; }
function mount3d(root, opt) {
  $$('.thumb[data-id]', root).forEach(el => {
    const p = prod(el.dataset.id);
    const s = GOLD3D.make(el, p.m, Object.assign({ lod: 1, yaw: 170, pitch: 55 }, opt || {}));
    el._s = s; SCS.push(s);
  });
}

/* ---------- Header ---------- */
const NAV = [['katalog', 'Katalog'], ['harga', 'Harga Emas'], ['tradein', 'Simulasi Trade-in'], ['wishlist', 'Wishlist'], ['janji', 'Janji Temu']];
function renderNav() {
  const nav = $('#nav');
  if (S.staff) { nav.innerHTML = '<button type="button" aria-current="page">Panel Staff / Owner</button>'; return; }
  const wc = Object.keys(S.wish).length;
  nav.innerHTML = NAV.map(n => '<button type="button" data-act="go" data-v="' + n[0] + '"' + (S.view === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + (n[0] === 'wishlist' ? '<span class="n">' + (wc || '') + '</span>' : '') + '</button>').join('');
}
function renderAcct() {
  const a = $('#acct');
  if (S.staff) a.innerHTML = '<span class="who">Staff · Owner</span><button type="button" class="btn sm" data-act="logout">Keluar</button>';
  else if (S.user) a.innerHTML = '<span class="who">' + S.user.nama + '</span><button type="button" class="btn sm" data-act="logout">Keluar</button>';
  else a.innerHTML = '<button type="button" class="btn sm" data-act="auth" data-t="masuk">Masuk</button><button type="button" class="btn sm pri" data-act="auth" data-t="daftar">Daftar</button><button type="button" class="linkbtn" data-act="auth" data-t="staff">Staff</button>';
}
function renderTicker() {
  $('#ticker').innerHTML = ['24K', '22K', '18K', '17K'].map(k => '<span class="tk"><i>' + k + '</i><b>' + rp(gramJual(k)) + '/g</b></span>').join('') +
    '<span class="tk-up">Harga toko · diperbarui ' + fdate(today) + ', 08.00 · contoh</span>';
}

/* ---------- Navigasi ---------- */
function setView(v) {
  S.view = v;
  $$('#cust > section').forEach(s => { s.hidden = s.id !== 'v-' + v; });
  killScenes();
  renderNav();
  if (v === 'katalog') { renderGrid(); }
  if (v === 'harga') renderHarga();
  if (v === 'tradein') renderTrade();
  if (v === 'wishlist') renderWish();
  if (v === 'janji') renderJanji();
  window.scrollTo(0, 0);
  if (v === 'katalog') startHero();
}
function showMode() {
  $('#cust').hidden = S.staff; $('#staff').hidden = !S.staff;
  renderNav(); renderAcct();
  if (S.staff) { killScenes(); renderStaff(); window.scrollTo(0, 0); } else setView('katalog');
}
function requireLogin(cb) {
  if (S.user) { cb(); return; }
  S.pending = cb; openAuth('masuk');
}

/* Pemutar interaktif: gerakkan mouse = miringkan, seret = putar 360°, scroll = zoom, klik dua kali = reset */
function bindViewer(el, getS, wheel) {
  let drag = null, locked = false;
  el.style.touchAction = 'none'; el.style.cursor = 'grab';
  el.addEventListener('pointerdown', e => {
    const s = getS(); if (!s || e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY }; locked = true; s.dragStart();
    try { el.setPointerCapture(e.pointerId); } catch (x) {}
    el.style.cursor = 'grabbing';
  });
  el.addEventListener('pointermove', e => {
    const s = getS(); if (!s) return;
    if (drag) { s.dragBy(e.clientX - drag.x, e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; }
    else if (!locked) { const r = el.getBoundingClientRect(); s.follow((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5); }
  });
  const end = () => { if (!drag) return; drag = null; el.style.cursor = 'grab'; const s = getS(); if (s) s.dragEnd(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => { if (drag) return; locked = false; const s = getS(); if (s) s.idle(); });
  el.addEventListener('dblclick', () => { const s = getS(); if (s) { s.reset(); locked = false; } });
  if (wheel) el.addEventListener('wheel', e => { const s = getS(); if (!s) return; e.preventDefault(); s.zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
}

/* Foto asli: scroll = zoom ke arah mouse, seret = geser, klik dua kali = perbesar/kembali */
function bindPhoto(el) {
  const img = $('img', el); let z = 1, x = 0, y = 0, drag = null;
  el.style.cursor = 'zoom-in';
  const apply = () => {
    const r = el.getBoundingClientRect(), mx = r.width * (z - 1) / 2, my = r.height * (z - 1) / 2;
    x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
    img.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + z.toFixed(3) + ')';
    el.style.cursor = z > 1 ? 'grab' : 'zoom-in';
  };
  const zoomAt = (nz, cx, cy) => { nz = Math.max(1, Math.min(5, nz)); const f = nz / z; x = cx - (cx - x) * f; y = cy - (cy - y) * f; z = nz; if (z === 1) { x = 0; y = 0; } apply(); };
  const rel = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
  el.addEventListener('wheel', e => { e.preventDefault(); const c = rel(e); zoomAt(z * (e.deltaY < 0 ? 1.2 : 1 / 1.2), c[0], c[1]); }, { passive: false });
  el.addEventListener('dblclick', e => { const c = rel(e); if (z > 1) zoomAt(1, 0, 0); else zoomAt(2.5, c[0], c[1]); });
  el.addEventListener('pointerdown', e => { if (z <= 1 || e.button > 0) return; drag = { x: e.clientX, y: e.clientY }; img.style.transition = 'none'; el.style.cursor = 'grabbing'; try { el.setPointerCapture(e.pointerId); } catch (k) {} });
  el.addEventListener('pointermove', e => { if (!drag) return; x += e.clientX - drag.x; y += e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; apply(); });
  const end = () => { if (!drag) return; drag = null; img.style.transition = ''; apply(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}

/* ---------- Hero ---------- */
let heroS = null, heroBound = false;
function startHero() {
  const host = $('#heroObj');
  if (heroS) heroS.destroy();
  heroS = GOLD3D.make(host, HERO, { scale: 2.35 * Math.min(1, ($('#stage').clientWidth || 555) / 555), yaw: 170, pitch: 55 });
  heroS.idle();
  $('#heroStamp').innerHTML = '<div style="color:var(--gold-bright);transform:rotate(8deg);width:86px">' + hall('750', '18K') + '</div>';
  if (!heroBound) { heroBound = true; bindViewer($('#stage'), () => heroS, false); }
}

/* ---------- Katalog ---------- */
const JENIS_F = [['semua', 'Semua'], ['cincin', 'Cincin'], ['kalung', 'Kalung'], ['gelang', 'Gelang'], ['anting', 'Anting'], ['liontin', 'Liontin']];
function renderFilters() {
  $('#fJenis').innerHTML = JENIS_F.map(j => '<button type="button" class="chip" data-act="fj" data-j="' + j[0] + '" aria-pressed="' + (S.jenis === j[0]) + '">' + j[1] + '</button>').join('');
  $('#fKarat').innerHTML = '<option value="semua">Semua karat</option>' + KARAT.map(k => '<option value="' + k.k + '"' + (S.karat === k.k ? ' selected' : '') + '>' + k.k + ' · ' + k.st + '</option>').join('');
}
const cardHTML = p => '<article class="card" tabindex="0" data-act="open" data-id="' + p.id + '" aria-label="Lihat ' + p.nama + '">' +
  '<div class="cv velvet"><div class="floor"></div>' + (p.foto ? '<img class="ph" src="' + p.foto + '" alt="" loading="lazy" draggable="false">' : '<div class="thumb" data-id="' + p.id + '"></div>') +
  '<span class="stamp">' + kInfo(p.karat).st + ' · ' + p.karat + '</span>' +
  '<button type="button" class="hb" data-act="wish" data-id="' + p.id + '" aria-pressed="' + (!!S.wish[p.id]) + '" aria-label="Simpan ' + p.nama + ' ke wishlist">' + HEART_SVG + '</button>' +
  '<span class="zh">' + (p.foto ? 'ARAHKAN MOUSE UNTUK ZOOM' : 'GERAKKAN MOUSE UNTUK MEMUTAR') + '</span></div>' +
  '<div class="cb"><h3>' + p.nama + '</h3><span class="meta">' + JN[p.jenis] + ' · ' + p.karat + ' · ' + gr(p.berat) + '</span>' +
  '<div class="price"><span>' + rp(hargaP(p)) + '</span><small>' + (p.stok > 0 ? 'Stok ' + p.stok : 'Stok habis') + '</small></div></div></article>';
function renderGrid() {
  renderFilters();
  let list = P.filter(p => p.aktif && (S.jenis === 'semua' || p.jenis === S.jenis) && (S.karat === 'semua' || p.karat === S.karat) &&
    (!S.q || (p.nama + ' ' + p.kode).toLowerCase().indexOf(S.q) > -1));
  if (S.sort === 'lo') list.sort((a, b) => hargaP(a) - hargaP(b));
  if (S.sort === 'hi') list.sort((a, b) => hargaP(b) - hargaP(a));
  if (S.sort === 'w') list.sort((a, b) => b.berat - a.berat);
  const g = $('#grid');
  SCS = SCS.filter(s => { if (g.contains(s.host)) { s.destroy(); return false; } return true; });
  g.innerHTML = list.map(cardHTML).join('');
  if (!list.length) { const e = document.createElement('p'); e.className = 'empty'; e.textContent = 'Belum ada perhiasan yang cocok dengan filter ini.'; g.appendChild(e); }
  mount3d(g);
}
function cardHover(root) {
  root.addEventListener('pointermove', e => {
    const c = e.target.closest('.card'); if (!c) return;
    const cv = $('.cv', c), th = $('.thumb', c), ph = $('.ph', c);
    if (ph) { const q = cv.getBoundingClientRect(); ph.style.transformOrigin = ((e.clientX - q.left) / q.width * 100) + '% ' + ((e.clientY - q.top) / q.height * 100) + '%'; return; }
    if (!th || !th._s) return;
    const r = cv.getBoundingClientRect();
    th._s.follow((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    th._s.zoomTo(1.1);
  });
  root.addEventListener('pointerout', e => {
    const c = e.target.closest('.card'); if (!c || c.contains(e.relatedTarget)) return;
    const th = $('.thumb', c); if (th && th._s) { th._s.rest(); th._s.zoomTo(1); }
  });
}

/* ---------- Detail produk ---------- */
let viewS = null;
function openModal(id) {
  const p = prod(id), k = kInfo(p.karat), hg = gramJual(p.karat);
  S.curId = id;
  const low = p.stok <= 2;
  $('#sheet').innerHTML = '<button type="button" class="x" data-act="close" aria-label="Tutup">&times;</button>' +
    '<div class="viewer velvet" id="viewer"><div class="floor"></div>' + (p.foto ? '<div class="photo" id="vphoto"><img src="' + p.foto + '" alt="' + p.nama + '" draggable="false"></div>' : '<div class="thumb" id="vthumb"></div>') +
    '<div class="vstamp" style="color:var(--gold-bright);width:78px">' + hall(k.st, p.karat) + '</div>' +
    '<div class="vscale"><small>BERAT BERSIH</small>' + gr(p.berat).replace(' g', '') + ' g</div>' +
    '<div class="hint">GERAKKAN MOUSE KIRI-KANAN UNTUK MEMUTAR 360°</div></div>' +
    '<div class="info"><p class="kc">' + JN[p.jenis] + ' · ' + p.kode + '</p><h2>' + p.nama + '</h2><p class="desc">' + p.desc + '</p>' +
    '<dl class="bk"><div><dt>Kadar</dt><dd>' + p.karat + ' · ' + k.kadar + '%</dd></div><div><dt>Berat</dt><dd>' + gr(p.berat) + '</dd></div>' +
    '<div><dt>Emas (' + rp(hg) + '/g)</dt><dd>' + rp(emasP(p)) + '</dd></div><div><dt>Ongkos pembuatan</dt><dd>' + rp(p.ongkos) + '</dd></div>' +
    (p.batu ? '<div><dt>Nilai batu</dt><dd>' + rp(p.batu) + '</dd></div>' : '') +
    '<div class="tot"><dt>Harga</dt><dd>' + rp(hargaP(p)) + '</dd></div></dl>' +
    '<div><span class="pill ' + (p.stok <= 0 ? 'crit' : low ? 'warn' : 'ok') + '">' + (p.stok <= 0 ? 'Stok habis' : low ? 'Stok tersisa ' + p.stok : 'Stok tersedia ' + p.stok) + '</span></div>' +
    '<div class="acts"><button type="button" class="btn gold" data-act="wish" data-id="' + p.id + '" id="mWish">' + (S.wish[p.id] ? 'Tersimpan di wishlist' : 'Simpan ke wishlist') + '</button>' +
    '<button type="button" class="btn" data-act="appt-for" data-id="' + p.id + '">Buat janji temu</button>' +
    '<button type="button" class="btn" data-act="trade-for" data-id="' + p.id + '">Tukar tambah</button></div></div>';
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
  if (viewS) { viewS.destroy(); viewS = null; }
  if (p.foto) bindPhoto($('#vphoto'));
  else {
    viewS = GOLD3D.make($('#vthumb'), p.m, { yaw: 340, pitch: 70, scale: 2.2 });
    viewS.idle();
    bindViewer($('#viewer'), () => viewS, true);
  }
  $('#sheet .x').focus();
}
function closeModal() {
  $('#modal').hidden = true; document.body.style.overflow = '';
  if (viewS) { viewS.destroy(); viewS = null; }
}

/* ---------- Login / registrasi ---------- */
function authHTML(tab) {
  const t = (id, l) => '<button type="button" data-act="auth-tab" data-t="' + id + '" aria-pressed="' + (tab === id) + '">' + l + '</button>';
  let f, head, btn;
  if (tab === 'staff') {
    head = 'Masuk staff / owner'; btn = 'Masuk ke panel';
    f = '<div class="fld"><label for="auU">Username</label><input class="in" id="auU" autocomplete="username"></div>' +
      '<div class="fld"><label for="auP">Password</label><input class="in" id="auP" type="password" autocomplete="current-password"></div>' +
      '<p class="hintbox">Akun awal dari seeder: username <b>owner</b>, password <b>masringgit</b>. Segera ganti setelah dipasang.</p>';
  } else if (tab === 'daftar') {
    head = 'Buat akun pelanggan'; btn = 'Daftar';
    f = '<div class="fld"><label for="auN">Nama</label><input class="in" id="auN" autocomplete="name"></div>' +
      '<div class="fld"><label for="auE">Email</label><input class="in" id="auE" type="email" autocomplete="email"></div>' +
      '<div class="fld"><label for="auP">Password (min. 6 karakter)</label><input class="in" id="auP" type="password" autocomplete="new-password"></div>';
  } else {
    head = 'Masuk pelanggan'; btn = 'Masuk';
    f = '<div class="fld"><label for="auE">Email</label><input class="in" id="auE" type="email" autocomplete="email"></div>' +
      '<div class="fld"><label for="auP">Password</label><input class="in" id="auP" type="password" autocomplete="current-password"></div>' +
      '';
  }
  return '<button type="button" class="x" data-act="auth-close" aria-label="Tutup">&times;</button><div class="authbox"><h2>' + head + '</h2>' +
    '<div class="tabs">' + t('masuk', 'Masuk') + t('daftar', 'Daftar') + t('staff', 'Staff') + '</div>' +
    '<form class="form" style="margin-top:0" data-form="auth" data-tab="' + tab + '">' + f + '<p class="err" id="authErr" role="alert"></p><button type="submit" class="btn pri">' + btn + '</button></form></div>';
}
function openAuth(tab) { S.authTab = tab; $('#authSheet').innerHTML = authHTML(tab); $('#auth').hidden = false; document.body.style.overflow = 'hidden'; const i = $('#authSheet .in'); if (i) i.focus(); }
function closeAuth() { $('#auth').hidden = true; document.body.style.overflow = $('#modal').hidden ? '' : 'hidden'; S.pending = null; }
async function doAuth(form) {
  const tab = form.dataset.tab, err = $('#authErr'), v = id => ($('#' + id, form) ? $('#' + id, form).value.trim() : '');
  const btn = $('button[type=submit]', form); err.textContent = '';
  let r;
  if (tab === 'staff') {
    if (!v('auU') || !v('auP')) { err.textContent = 'Isi username dan password.'; return; }
    btn.disabled = true; r = await api('POST', '/api/auth/staff', { username: v('auU'), password: v('auP') }); btn.disabled = false;
    if (!r.ok) { err.textContent = r.message; return; }
    await loadAll(); $('#auth').hidden = true; document.body.style.overflow = ''; S.pending = null; showMode(); toast('Selamat datang, ' + 'owner' + '.');
    return;
  }
  const email = v('auE'), pw = v('auP'), nama = tab === 'daftar' ? v('auN') : '';
  if (tab === 'daftar' && !nama) { err.textContent = 'Nama wajib diisi.'; return; }
  if (email.indexOf('@') < 1) { err.textContent = 'Isi email yang valid, misalnya nama@email.com.'; return; }
  if (pw.length < 6) { err.textContent = 'Password minimal 6 karakter.'; return; }
  btn.disabled = true;
  r = await api('POST', tab === 'daftar' ? '/api/auth/register' : '/api/auth/login', tab === 'daftar' ? { nama: nama, email: email, password: pw } : { email: email, password: pw });
  btn.disabled = false;
  if (!r.ok) { err.textContent = r.message; return; }
  await loadAll();
  const cb = S.pending; S.pending = null;
  $('#auth').hidden = true; document.body.style.overflow = $('#modal').hidden ? '' : 'hidden';
  renderAcct(); renderNav();
  toast('Halo, ' + S.user.nama + '.');
  if (cb) cb(); else if (S.view === 'wishlist' || S.view === 'janji' || S.view === 'katalog') setView(S.view);
}
async function logout() {
  await api('POST', '/api/auth/logout');
  const wasStaff = S.staff;
  await loadAll();
  if (wasStaff) { showMode(); toast('Anda sudah keluar.'); return; }
  renderAcct();
  if (S.view === 'wishlist' || S.view === 'janji') setView(S.view); else renderNav();
  $$('[data-act="wish"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  toast('Anda sudah keluar.');
}
function toggleWish(id) {
  requireLogin(async () => {
    const r = await api('POST', '/api/wishlist/' + id);
    if (!r.ok) { toast(r.message); return; }
    if (r.data.aktif) S.wish[id] = true; else delete S.wish[id];
    $$('[data-act="wish"][data-id="' + id + '"]').forEach(b => {
      b.setAttribute('aria-pressed', String(!!S.wish[id]));
      if (b.id === 'mWish') b.textContent = S.wish[id] ? 'Tersimpan di wishlist' : 'Simpan ke wishlist';
    });
    renderNav();
    if (S.view === 'wishlist') renderWish();
    toast(S.wish[id] ? prod(id).nama + ' disimpan ke wishlist.' : 'Dihapus dari wishlist.');
  });
}

/* ---------- Harga emas per karat ---------- */
function renderHarga() {
  $('#kgrid').innerHTML = KARAT.map(k => '<div class="kc2"><div class="top2"><span style="color:var(--gold)">' + hall(k.st, k.k) + '</span><div><h3>' + k.k + '</h3><span class="meta">Kadar ' + String(k.kadar).replace('.', ',') + '%</span></div></div>' +
    '<div class="kbar"><i style="width:' + k.kadar + '%"></i></div>' +
    '<div class="pl"><span>Harga jual / gram</span><b>' + rp(gramJual(k.k)) + '</b></div>' +
    '<div class="pl"><span>Nilai trade-in / gram</span><b>' + rp(gramTrade(k.k)) + '</b></div></div>').join('');
  $('#hargaNote').textContent = 'Acuan emas 24K: ' + rp(params.acuan) + ' per gram. Potongan trade-in: ' + params.potong + '%. Diperbarui toko pada ' + fdate(today) + ', 08.00. Angka contoh.';
}

/* ---------- Simulasi trade-in ---------- */
let ledShown = 0, ledRaf = 0;
function tween(to) {
  cancelAnimationFrame(ledRaf);
  const el = $('#trVal'); if (!el) return;
  if (reduce) { ledShown = to; el.textContent = rp(to); return; }
  const from = ledShown, t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 380); ledShown = from + (to - from) * (1 - Math.pow(1 - k, 3)); el.textContent = rp(ledShown); if (k < 1) ledRaf = requestAnimationFrame(step); };
  ledRaf = requestAnimationFrame(step);
}
function trCalc() {
  const berat = Math.max(0, parseFloat($('#trBerat').value) || 0), karat = $('#trKarat').value, tg = $('#trTarget').value;
  const per = gramTrade(karat), nilai = berat * per;
  tween(nilai);
  let rows = '<span>Berat ' + gr(berat) + '</span><span>Kadar ' + karat + ' (' + String(kInfo(karat).kadar).replace('.', ',') + '%)</span><span>' + rp(per) + '/g</span>';
  if (tg) {
    const p = prod(tg), sel = hargaP(p) - nilai;
    rows += '<span style="flex-basis:100%">' + p.nama + ': ' + rp(hargaP(p)) + '</span><span style="flex-basis:100%;color:#ffcf5a">' + (sel > 0 ? 'Tambah bayar ' + rp(sel) : 'Kelebihan nilai ' + rp(-sel)) + '</span>';
  }
  $('#trRows').innerHTML = rows;
  return { berat, karat, nilai };
}
function renderTrade() {
  const cur = $('#trKarat').value || '18K';
  $('#trKarat').innerHTML = KARAT.map(k => '<option value="' + k.k + '">' + k.k + ' · ' + k.st + '</option>').join('');
  $('#trKarat').value = cur;
  $('#trTarget').innerHTML = '<option value="">Tidak ada, hanya hitung nilai</option>' + P.filter(p => p.aktif).map(p => '<option value="' + p.id + '">' + p.nama + ' · ' + rp(hargaP(p)) + '</option>').join('');
  if (S.tradeTarget) { $('#trTarget').value = S.tradeTarget; S.tradeTarget = ''; }
  ledShown = 0; trCalc();
}

/* ---------- Wishlist ---------- */
function gate(title, text, btns) { return '<div class="gate"><h3>' + title + '</h3><p>' + text + '</p><div class="btns" style="justify-content:center">' + btns + '</div></div>'; }
function renderWish() {
  const b = $('#wishBody'), ids = Object.keys(S.wish);
  SCS = SCS.filter(s => { if (b.contains(s.host)) { s.destroy(); return false; } return true; });
  if (!S.user) { b.innerHTML = gate('Masuk untuk memakai wishlist', 'Simpan perhiasan yang Anda suka dan lihat lagi kapan saja. Wishlist tersimpan di akun Anda.', '<button type="button" class="btn pri" data-act="auth" data-t="masuk">Masuk</button><button type="button" class="btn" data-act="auth" data-t="daftar">Daftar</button>'); return; }
  if (!ids.length) { b.innerHTML = gate('Wishlist masih kosong', 'Tekan ikon hati pada perhiasan di katalog untuk menyimpannya di sini.', '<button type="button" class="btn gold" data-act="go" data-v="katalog">Lihat koleksi</button>'); return; }
  b.innerHTML = '<div class="grid" id="wGrid" style="margin-top:22px">' + ids.map(id => cardHTML(prod(id))).join('') + '</div><div class="btns" style="margin-top:22px"><button type="button" class="btn pri" data-act="go" data-v="janji">Buat janji temu</button></div>';
  mount3d(b); cardHover($('#wGrid'));
}

/* ---------- Janji temu ---------- */
const SLOTS = (function () { const a = []; for (let h = 10; h <= 18; h++) { a.push(String(h).padStart(2, '0') + ':00'); a.push(String(h).padStart(2, '0') + ':30'); } return a; })();
const PERLU = ['Melihat produk', 'Trade-in', 'Konsultasi', 'Mengambil pesanan'];
const stCls = s => s === 'Dikonfirmasi' ? 'ok' : s === 'Menunggu' ? 'warn' : s === 'Dibatalkan' ? 'crit' : 'neutral';
function renderJanji() {
  const b = $('#janjiBody');
  if (!S.user) { b.innerHTML = gate('Masuk untuk membuat janji temu', 'Kami butuh akun Anda supaya staff bisa mengonfirmasi dan Anda bisa memantau statusnya.', '<button type="button" class="btn pri" data-act="auth" data-t="masuk">Masuk</button><button type="button" class="btn" data-act="auth" data-t="daftar">Daftar</button>'); return; }
  const mine = S.appts.filter(a => a.nama === S.user.nama);
  const wishOpts = '<option value="">Belum menentukan</option>' + P.filter(p => p.aktif).map(p => '<option value="' + p.id + '"' + (S.apptProduk === p.id ? ' selected' : '') + '>' + p.nama + (S.wish[p.id] ? ' (wishlist)' : '') + '</option>').join('');
  b.innerHTML = '<div class="tr-grid"><div class="panel"><h3>Jadwalkan kunjungan</h3><p class="sub2">Toko buka Senin sampai Sabtu, 10.00 sampai 19.00. Hari Minggu libur.</p>' +
    '<form class="form" data-form="appt"><div class="grid2"><div class="fld"><label for="apD">Tanggal</label><input class="in" id="apD" type="date" min="' + ymd(today) + '" value="' + ymd(nextOpen(addDays(today, 1))) + '"></div>' +
    '<div class="fld"><label for="apT">Waktu</label><select class="in" id="apT">' + SLOTS.map(s => '<option>' + s + '</option>').join('') + '</select></div></div>' +
    '<div class="fld"><label for="apK">Keperluan</label><select class="in" id="apK">' + PERLU.map(s => '<option>' + s + '</option>').join('') + '</select></div>' +
    '<div class="fld"><label for="apP">Perhiasan yang ingin dilihat</label><select class="in" id="apP">' + wishOpts + '</select></div>' +
    '<p class="err" id="apErr" role="alert"></p><div class="btns"><button type="submit" class="btn pri">Buat janji temu</button></div></form></div>' +
    '<div class="panel"><h3>Janji temu saya</h3>' + (mine.length ? '<div class="list">' + mine.map(a => '<div class="li"><div><b>' + fymd(a.tgl) + ' · ' + a.jam + '</b><span class="sub">' + a.perlu + (a.produk ? ' · ' + pname(a.produk) : '') + '</span>' +
      (a.status === 'Menunggu' || a.status === 'Dikonfirmasi' ? '<button type="button" class="linkbtn" data-act="a-cancel" data-id="' + a.id + '">Batalkan</button>' : '') + '</div><span class="pill ' + stCls(a.status) + '">' + a.status + '</span></div>').join('') + '</div>' :
      '<p class="sub2" style="margin-top:14px">Belum ada janji temu. Isi formulir di samping untuk membuatnya.</p>') + '</div></div>';
  S.apptProduk = '';
}
async function doAppt(form) {
  const d = $('#apD').value, t = $('#apT').value, err = $('#apErr'); err.textContent = '';
  if (!d) { err.textContent = 'Pilih tanggal kunjungan.'; return; }
  const r = await api('POST', '/api/janji', { tgl: d, jam: t, perlu: $('#apK').value, produk: $('#apP').value || null });
  if (!r.ok) { err.textContent = r.message; return; }
  S.appts.push(cN(r.data));
  toast('Janji temu dibuat. Menunggu konfirmasi staff.'); renderJanji();
}

/* ---------- Panel staff ---------- */
const STAB = [['dash', 'Dashboard'], ['katalog', 'Katalog & Stok'], ['harga', 'Harga & Parameter'], ['tradein', 'Trade-in'], ['janji', 'Janji Temu'], ['trx', 'Transaksi'], ['intl', 'Harga Emas Dunia'], ['lap', 'Laporan']];
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const monthSales = () => sum(S.trx.filter(x => new Date(x.tgl + 'T12:00:00') >= addDays(today, -29)), x => x.total);
function renderSide() {
  const nT = S.trade.filter(t => t.status === 'Baru').length, nJ = S.appts.filter(a => a.status === 'Menunggu').length;
  $('#side').innerHTML = '<h4>Pengelolaan</h4>' + STAB.map(t => '<button type="button" data-act="stab" data-t="' + t[0] + '"' + (S.stab === t[0] ? ' aria-current="page"' : '') + '>' + t[1].replace('&', '&amp;') +
    '<span class="n">' + (t[0] === 'tradein' ? (nT || '') : t[0] === 'janji' ? (nJ || '') : '') + '</span></button>').join('');
}
function renderStaff() {
  renderSide();
  const fn = { dash: pDash, katalog: pKatalog, harga: pHarga, tradein: pTrade, janji: pJanji, trx: pTrx, intl: pIntl, lap: pLap }[S.stab];
  $('#spanel').innerHTML = fn();
  if (S.stab === 'dash') bindChart('chDash', XAU.map(x => ({ d: x.d, v: x.v })), usd);
  if (S.stab === 'intl') bindChart('chIntl', XAU.map(x => ({ d: x.d, v: x.v })), usd);
}
const head = (t, extra) => '<div class="sp-h"><h2>' + t + '</h2>' + (extra || '') + '</div>';
function chartSVG(id, pts, fmt) {
  if (pts.length < 2) return '<p class="sub2">Belum ada data harga dunia. Catat dengan perintah <code>php artisan emas:catat</code>.</p>';
  const W = 640, H = 270, L = 62, R = 14, T = 14, B = 30, pw = W - L - R, ph = H - T - B;
  const vs = pts.map(p => p.v), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), pad = (mx - mn) * 0.18 || 1, lo = mn - pad, hi = mx + pad;
  const X = i => L + i * pw / (pts.length - 1), Y = v => T + ph - (v - lo) / (hi - lo) * ph;
  let s = '<svg class="chart" id="' + id + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik harga emas dunia 30 hari terakhir">', k;
  for (k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4; s += '<line class="gl-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="ax" x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + fmt(v) + '</text>'; }
  [0, 7, 14, 21, pts.length - 1].filter((v, k, a) => v >= 0 && a.indexOf(v) === k).forEach(i => { s += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + pts[i].d.getDate() + ' ' + BLN[pts[i].d.getMonth()] + '</text>'; });
  const line = pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ');
  s += '<polygon class="area" points="' + X(0).toFixed(1) + ',' + (T + ph) + ' ' + line + ' ' + X(pts.length - 1).toFixed(1) + ',' + (T + ph) + '"/><polyline class="ln" points="' + line + '"/>';
  s += '<circle class="dotc" cx="' + X(pts.length - 1).toFixed(1) + '" cy="' + Y(pts[pts.length - 1].v).toFixed(1) + '" r="5"/><line class="xh" id="' + id + 'x" x1="0" x2="0" y1="' + T + '" y2="' + (T + ph) + '"/></svg>';
  return s;
}
function bindChart(id, pts, fmt) {
  const svg = $('#' + id); if (!svg) return;
  const xh = $('#' + id + 'x'), rd = svg.parentNode.querySelector('.read'), W = 640, L = 62, R = 14, pw = W - L - R;
  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, i = Math.max(0, Math.min(pts.length - 1, Math.round((x - L) / pw * (pts.length - 1))));
    xh.setAttribute('x1', L + i * pw / (pts.length - 1)); xh.setAttribute('x2', L + i * pw / (pts.length - 1)); xh.style.opacity = 1;
    rd.textContent = HRI[pts[i].d.getDay()] + ', ' + fdate(pts[i].d) + ' · ' + fmt(pts[i].v) + ' per troy ons';
  });
  svg.addEventListener('pointerleave', () => { xh.style.opacity = 0; rd.textContent = 'Arahkan mouse ke grafik untuk melihat harga per hari.'; });
}
const xauStats = () => { const v = XAU.map(x => x.v); if (!v.length) return { last: 0, first: 0, mn: 0, mx: 0, chg: 0 }; const n = v.length - 1; return { last: v[n], first: v[0], mn: Math.min.apply(null, v), mx: Math.max.apply(null, v), chg: (v[n] / v[0] - 1) * 100 }; };
const idrGram = usdOz => usdOz * params.kurs / 31.1035;

function pDash() {
  const aktif = P.filter(p => p.aktif), st = xauStats();
  const upc = S.appts.filter(a => a.status === 'Menunggu' || a.status === 'Dikonfirmasi').sort((a, b) => (a.tgl + a.jam).localeCompare(b.tgl + b.jam)).slice(0, 4);
  const low = P.filter(p => p.aktif && p.stok <= 2);
  return head('Dashboard') +
    '<div class="kpis"><div class="kpi"><small>Produk aktif</small><b>' + aktif.length + '</b><span>di katalog pelanggan</span></div>' +
    '<div class="kpi"><small>Total stok</small><b>' + sum(aktif, p => p.stok) + '</b><span>pcs perhiasan</span></div>' +
    '<div class="kpi"><small>Janji temu menunggu</small><b>' + S.appts.filter(a => a.status === 'Menunggu').length + '</b><span>perlu dikonfirmasi</span></div>' +
    '<div class="kpi"><small>Omzet 30 hari</small><b>' + rp(monthSales()) + '</b><span>dari ' + S.trx.length + ' transaksi</span></div></div>' +
    '<div class="two"><div class="panel"><h3>Emas dunia, 30 hari</h3><p class="sub2">' + usd(st.last) + ' per troy ons · <span class="pill ' + (st.chg >= 0 ? 'ok' : 'crit') + '">' + (st.chg >= 0 ? '+' : '') + st.chg.toFixed(1).replace('.', ',') + '%</span></p><div class="read">Arahkan mouse ke grafik untuk melihat harga per hari.</div>' + chartSVG('chDash', XAU, usd) + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:18px"><div class="panel"><h3>Janji temu terdekat</h3>' + (upc.length ? '<div class="list">' + upc.map(a => '<div class="li"><div><b>' + a.nama + '</b><span class="sub">' + fymd(a.tgl) + ' · ' + a.jam + ' · ' + a.perlu + '</span></div><span class="pill ' + stCls(a.status) + '">' + a.status + '</span></div>').join('') + '</div>' : '<p class="sub2">Belum ada janji temu.</p>') + '</div>' +
    '<div class="panel"><h3>Stok menipis</h3>' + (low.length ? '<div class="list">' + low.map(p => '<div class="li"><div><b>' + p.nama + '</b><span class="sub">' + p.kode + '</span></div><span class="pill ' + (p.stok <= 0 ? 'crit' : 'warn') + '">Sisa ' + p.stok + '</span></div>').join('') + '</div>' : '<p class="sub2">Semua stok aman.</p>') + '</div></div></div>';
}
function pKatalog() {
  const form = S.addOpen ? '<div class="panel" style="margin-bottom:18px"><h3>Produk baru</h3><form class="form" data-form="newprod"><div class="grid3">' +
    '<div class="fld"><label for="npN">Nama</label><input class="in" id="npN"></div>' +
    '<div class="fld"><label for="npJ">Jenis</label><select class="in" id="npJ">' + Object.keys(JN).map(j => '<option value="' + j + '">' + JN[j] + '</option>').join('') + '</select></div>' +
    '<div class="fld"><label for="npK">Karat</label><select class="in" id="npK">' + KARAT.map(k => '<option' + (k.k === '18K' ? ' selected' : '') + '>' + k.k + '</option>').join('') + '</select></div>' +
    '<div class="fld"><label for="npW">Berat (g)</label><input class="in" id="npW" type="number" step="0.1" min="0.1" value="3"></div>' +
    '<div class="fld"><label for="npO">Ongkos (Rp)</label><input class="in" id="npO" type="number" step="1000" min="0" value="400000"></div>' +
    '<div class="fld"><label for="npB">Nilai batu (Rp)</label><input class="in" id="npB" type="number" step="1000" min="0" value="0"></div>' +
    '<div class="fld"><label for="npS">Stok</label><input class="in" id="npS" type="number" min="0" value="1"></div>' +
    '<div class="fld"><label for="npT">Warna emas</label><select class="in" id="npT"><option value="kuning">Kuning</option><option value="rose">Rose</option><option value="putih">Putih</option></select></div></div>' +
    '<p class="err" id="npErr" role="alert"></p><div class="btns"><button type="submit" class="btn pri">Simpan produk</button><button type="button" class="btn" data-act="np-toggle">Batal</button></div></form></div>' : '';
  return head('Katalog & stok', '<button type="button" class="btn sm pri" data-act="np-toggle">' + (S.addOpen ? 'Tutup form' : 'Tambah produk') + '</button>') + form +
    '<div class="panel"><div class="tw"><table><thead><tr><th>Produk</th><th>Karat</th><th class="r">Berat</th><th class="r">Harga</th><th>Stok</th><th>Aktif</th><th></th></tr></thead><tbody>' +
    P.map(p => '<tr><td><div class="pn"><span class="mini">' + JN[p.jenis][0] + '</span><div><b>' + p.nama + '</b><br><span class="meta">' + p.kode + '</span></div></div></td><td>' + p.karat + '</td><td class="r mono">' + gr(p.berat) + '</td><td class="r mono">' + rp(hargaP(p)) + '</td>' +
      '<td><span class="stp"><button type="button" data-act="stok" data-id="' + p.id + '" data-d="-1" aria-label="Kurangi stok">&minus;</button><span>' + p.stok + '</span><button type="button" data-act="stok" data-id="' + p.id + '" data-d="1" aria-label="Tambah stok">+</button></span></td>' +
      '<td><button type="button" class="sw" role="switch" data-act="aktif" data-id="' + p.id + '" aria-checked="' + p.aktif + '" aria-label="Tampilkan di katalog"></button></td>' +
      '<td class="r"><button type="button" class="linkbtn" data-act="del" data-id="' + p.id + '">' + (S.delConfirm === p.id ? 'Yakin hapus?' : 'Hapus') + '</button></td></tr>').join('') + '</tbody></table></div></div>';
}
function hargaPreview(ac, po) {
  const sv = params.acuan, sp = params.potong;
  params.acuan = ac; params.potong = po;
  const h = KARAT.map(k => '<tr><td><b>' + k.k + '</b> <span class="meta">' + k.st + '</span></td><td class="r mono">' + rp(gramJual(k.k)) + '</td><td class="r mono">' + rp(gramTrade(k.k)) + '</td></tr>').join('');
  params.acuan = sv; params.potong = sp;
  return h;
}
function pHarga() {
  return head('Harga & parameter') + '<div class="two"><div class="panel"><h3>Parameter toko</h3><form class="form" data-form="params">' +
    '<div class="fld"><label for="pcA">Harga acuan emas 24K per gram (Rp)</label><input class="in num" id="pcA" type="number" min="100000" step="1000" value="' + params.acuan + '"></div>' +
    '<div class="fld"><label for="pcP">Potongan trade-in (%)</label><input class="in num" id="pcP" type="number" min="0" max="50" step="0.5" value="' + params.potong + '"></div>' +
    '<div class="fld"><label for="pcK">Kurs USD/IDR</label><input class="in num" id="pcK" type="number" min="1000" step="10" value="' + params.kurs + '"></div>' +
    '<p class="err" id="pcErr" role="alert"></p><div class="btns"><button type="submit" class="btn pri">Simpan parameter</button></div></form></div>' +
    '<div class="panel"><h3>Hasil per karat</h3><p class="sub2">Pratinjau langsung dari angka di formulir. Harga di katalog berubah setelah disimpan.</p><div class="tw"><table style="min-width:420px"><thead><tr><th>Karat</th><th class="r">Jual / g</th><th class="r">Trade-in / g</th></tr></thead><tbody id="hpv">' + hargaPreview(params.acuan, params.potong) + '</tbody></table></div></div></div>';
}
const TST = ['Baru', 'Diproses', 'Selesai'];
function pTrade() {
  return head('Trade-in') + '<div class="panel"><div class="tw"><table><thead><tr><th>Pelanggan</th><th>Perhiasan</th><th class="r">Berat</th><th>Karat</th><th class="r">Estimasi</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>' +
    (S.trade.map(t => '<tr><td><b>' + t.nama + '</b></td><td>' + t.jenis + '</td><td class="r mono">' + gr(t.berat) + '</td><td>' + t.karat + '</td><td class="r mono">' + rp(t.est) + '</td><td><span class="pill ' + (t.status === 'Selesai' ? 'ok' : t.status === 'Baru' ? 'warn' : 'neutral') + '">' + t.status + '</span></td><td>' +
      (t.status === 'Baru' ? '<button type="button" class="btn sm" data-act="t-proc" data-id="' + t.id + '">Proses</button>' :
        t.status === 'Diproses' ? '<div class="pn"><input class="in num" style="width:84px" id="tw-' + t.id + '" type="number" step="0.1" min="0.1" value="' + t.berat + '" aria-label="Berat aktual"><select class="in" style="width:84px" id="tk-' + t.id + '" aria-label="Karat aktual">' + KARAT.map(k => '<option' + (k.k === t.karat ? ' selected' : '') + '>' + k.k + '</option>').join('') + '</select><button type="button" class="btn sm pri" data-act="t-done" data-id="' + t.id + '">Selesaikan</button></div>' :
          '<span class="meta">Nilai akhir ' + rp(t.akhir.nilai) + '</span>') + '</td></tr>').join('') || '<tr><td colspan="7">Belum ada pengajuan trade-in.</td></tr>') + '</tbody></table></div>' +
    '<p class="disc">Estimasi dihitung dari data pelanggan. Isi berat dan karat hasil pemeriksaan untuk mendapat nilai akhir.</p></div>';
}
const AST = ['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];
function pJanji() {
  const rows = S.appts.slice().sort((a, b) => (a.tgl + a.jam).localeCompare(b.tgl + b.jam));
  return head('Janji temu') + '<div class="panel"><div class="tw"><table><thead><tr><th>Pelanggan</th><th>Jadwal</th><th>Keperluan</th><th>Perhiasan</th><th>Status</th></tr></thead><tbody>' +
    rows.map(a => '<tr><td><b>' + a.nama + '</b></td><td class="mono">' + fymd(a.tgl) + ' · ' + a.jam + '</td><td>' + a.perlu + '</td><td>' + (a.produk ? pname(a.produk) : '<span class="meta">Belum ditentukan</span>') + '</td><td><div class="seg">' +
      AST.map(s => '<button type="button" data-act="a-set" data-id="' + a.id + '" data-s="' + s + '" aria-pressed="' + (a.status === s) + '">' + s + '</button>').join('') + '</div></td></tr>').join('') + '</tbody></table></div></div>';
}
function pTrx() {
  const sellable = P.filter(p => p.aktif && p.stok > 0);
  const rows = S.trx.slice().sort((a, b) => b.tgl.localeCompare(a.tgl));
  return head('Transaksi') + '<div class="two"><div class="panel"><h3>Catat penjualan</h3><form class="form" data-form="trx">' +
    '<div class="fld"><label for="txN">Nama pelanggan</label><input class="in" id="txN" placeholder="Nama pelanggan"></div>' +
    '<div class="fld"><label for="txP">Perhiasan</label><select class="in" id="txP">' + (sellable.map(p => '<option value="' + p.id + '">' + p.nama + ' · ' + rp(hargaP(p)) + ' · stok ' + p.stok + '</option>').join('') || '<option value="">Tidak ada stok</option>') + '</select></div>' +
    '<div class="grid3"><div class="fld"><label for="txQ">Jumlah</label><input class="in" id="txQ" type="number" min="1" value="1"></div>' +
    '<div class="fld"><label for="txD">Potongan trade-in (Rp)</label><input class="in" id="txD" type="number" min="0" step="1000" value="0"></div>' +
    '<div class="fld"><label for="txB">Pembayaran</label><select class="in" id="txB"><option>Tunai</option><option>Transfer</option><option>QRIS</option></select></div></div>' +
    '<p class="err" id="txErr" role="alert"></p><div class="btns"><button type="submit" class="btn pri"' + (sellable.length ? '' : ' disabled') + '>Catat transaksi</button></div></form></div>' +
    '<div class="panel"><h3>Ringkasan</h3><div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr));margin:12px 0 0"><div class="kpi"><small>Transaksi</small><b>' + S.trx.length + '</b></div><div class="kpi"><small>Total omzet</small><b style="font-size:20px">' + rp(sum(S.trx, x => x.total)) + '</b></div></div></div></div>' +
    '<div class="panel" style="margin-top:18px"><h3>Riwayat transaksi</h3><div class="tw"><table><thead><tr><th>Tanggal</th><th>Pelanggan</th><th>Perhiasan</th><th class="r">Jml</th><th>Bayar</th><th class="r">Total</th></tr></thead><tbody>' +
    rows.map(x => '<tr><td class="mono">' + fymd(x.tgl) + '</td><td>' + x.nama + '</td><td>' + pname(x.produk) + '</td><td class="r mono">' + x.qty + '</td><td>' + x.bayar + '</td><td class="r mono">' + rp(x.total) + '</td></tr>').join('') + '</tbody></table></div></div>';
}
function pIntl() {
  const st = xauStats(), ig = idrGram(st.last), sel = (params.acuan / ig - 1) * 100;
  return head('Harga emas dunia', '<span class="note">Data contoh</span>') + '<div class="two"><div class="panel"><h3>XAU/USD, 30 hari terakhir</h3><p class="sub2">Harga per troy ons (31,1035 gram).</p><div class="read">Arahkan mouse ke grafik untuk melihat harga per hari.</div>' + chartSVG('chIntl', XAU, usd) + '</div>' +
    '<div class="panel"><h3>Ringkasan</h3><dl class="bk" style="margin-top:12px"><div><dt>Terbaru</dt><dd>' + usd(st.last) + '</dd></div><div><dt>Tertinggi 30 hari</dt><dd>' + usd(st.mx) + '</dd></div><div><dt>Terendah 30 hari</dt><dd>' + usd(st.mn) + '</dd></div><div><dt>Perubahan 30 hari</dt><dd>' + (st.chg >= 0 ? '+' : '') + st.chg.toFixed(1).replace('.', ',') + '%</dd></div>' +
    '<div><dt>Setara per gram (kurs ' + dot(params.kurs) + ')</dt><dd>' + rp(ig) + '</dd></div><div><dt>Acuan toko 24K</dt><dd>' + rp(params.acuan) + '</dd></div><div class="tot"><dt>Selisih acuan toko</dt><dd>' + (sel >= 0 ? '+' : '') + sel.toFixed(1).replace('.', ',') + '%</dd></div></dl>' +
    '<div class="btns" style="margin-top:14px"><button type="button" class="btn pri" data-act="apply-intl">Pakai sebagai acuan toko</button></div><p class="disc">Tombol ini mengganti harga acuan 24K sesuai harga dunia hari ini. Harga katalog ikut berubah.</p></div></div>';
}
function pLap() {
  const byJ = {}, byP = {};
  S.trx.forEach(x => { const p = prod(x.produk) || { jenis: 'lain', nama: '(dihapus)' }; byJ[p.jenis] = (byJ[p.jenis] || 0) + x.total; byP[p.nama] = (byP[p.nama] || 0) + x.qty; });
  const bars = (o, fmt) => { const e = Object.keys(o).sort((a, b) => o[b] - o[a]), mx = Math.max.apply(null, e.map(k => o[k]).concat([1])); return e.map(k => '<div class="barrow"><span>' + k + '</span><div class="bar2"><i style="width:' + (o[k] / mx * 100).toFixed(0) + '%"></i></div><span>' + fmt(o[k]) + '</span></div>').join('') || '<p class="sub2">Belum ada data.</p>'; };
  const sel = S.trade.filter(t => t.status === 'Selesai');
  return head('Laporan') + '<div class="kpis"><div class="kpi"><small>Total omzet</small><b style="font-size:20px">' + rp(sum(S.trx, x => x.total)) + '</b><span>' + S.trx.length + ' transaksi</span></div>' +
    '<div class="kpi"><small>Rata-rata transaksi</small><b style="font-size:20px">' + rp(S.trx.length ? sum(S.trx, x => x.total) / S.trx.length : 0) + '</b></div>' +
    '<div class="kpi"><small>Trade-in selesai</small><b>' + sel.length + '</b><span>nilai ' + rp(sum(sel, t => t.akhir.nilai)) + '</span></div>' +
    '<div class="kpi"><small>Janji temu</small><b>' + S.appts.length + '</b><span>' + S.appts.filter(a => a.status === 'Selesai').length + ' selesai</span></div></div>' +
    '<div class="two"><div class="panel"><h3>Omzet per jenis</h3><div style="margin-top:10px">' + bars(byJ, rp) + '</div></div><div class="panel"><h3>Perhiasan terlaris</h3><div style="margin-top:10px">' + bars(byP, v => v + ' pcs') + '</div></div></div>';
}

/* ---------- Penanganan klik ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  if (t.id === 'modal') { closeModal(); return; }
  if (t.id === 'auth') { closeAuth(); return; }
  const a = t.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act, id = a.dataset.id;
  switch (act) {
    case 'go': if (S.staff) return; if (!$('#modal').hidden) closeModal(); setView(a.dataset.v); break;
    case 'scroll': $('#' + a.dataset.t).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); break;
    case 'open': openModal(id); break;
    case 'close': closeModal(); break;
    case 'wish': e.stopPropagation(); toggleWish(id); break;
    case 'fj': S.jenis = a.dataset.j; renderGrid(); break;
    case 'appt-for': closeModal(); S.apptProduk = id; requireLogin(() => setView('janji')); break;
    case 'trade-for': closeModal(); S.tradeTarget = id; setView('tradein'); break;
    case 'auth': openAuth(a.dataset.t); break;
    case 'auth-tab': openAuth(a.dataset.t); break;
    case 'auth-close': closeAuth(); break;
    case 'logout': logout(); break;
    case 'a-cancel': api('POST', '/api/janji/' + id + '/status', { status: 'Dibatalkan' }).then(r => { if (!r.ok) { toast(r.message); return; } S.appts.find(x => x.id === id).status = 'Dibatalkan'; toast('Janji temu dibatalkan.'); renderJanji(); }); break;
    case 'stab': S.stab = a.dataset.t; S.delConfirm = null; renderStaff(); break;
    case 'np-toggle': S.addOpen = !S.addOpen; renderStaff(); break;
    case 'stok': { const p = prod(id), n = Math.max(0, p.stok + Number(a.dataset.d)); api('PATCH', '/api/staff/produk/' + id, { stok: n }).then(r => { if (!r.ok) { toast(r.message); return; } p.stok = r.data.stok; renderStaff(); }); break; }
    case 'aktif': { const p = prod(id); api('PATCH', '/api/staff/produk/' + id, { aktif: !p.aktif }).then(r => { if (!r.ok) { toast(r.message); return; } p.aktif = r.data.aktif; renderStaff(); }); break; }
    case 'del':
      if (S.delConfirm === id) {
        S.delConfirm = null;
        api('DELETE', '/api/staff/produk/' + id).then(r => { if (!r.ok) { toast(r.message); renderStaff(); return; } const i = P.findIndex(p => p.id === id); if (i > -1) P.splice(i, 1); delete S.wish[id]; toast('Produk dihapus dari katalog.'); renderStaff(); });
      } else { S.delConfirm = id; renderStaff(); }
      break;
    case 't-proc': api('POST', '/api/staff/trade-in/' + id + '/proses').then(r => { if (!r.ok) { toast(r.message); return; } Object.assign(S.trade.find(x => x.id === id), cN(r.data)); renderStaff(); }); break;
    case 't-done': {
      const w = parseFloat($('#tw-' + id).value) || 0, k = $('#tk-' + id).value;
      if (w <= 0) { toast('Isi berat hasil pemeriksaan.'); return; }
      api('POST', '/api/staff/trade-in/' + id + '/selesai', { berat: w, karat: k }).then(r => { if (!r.ok) { toast(r.message); return; } Object.assign(S.trade.find(x => x.id === id), cN(r.data)); toast('Trade-in selesai. Nilai akhir ' + rp(r.data.akhir.nilai) + '.'); renderStaff(); }); break;
    }
    case 'a-set': api('POST', '/api/janji/' + id + '/status', { status: a.dataset.s }).then(r => { if (!r.ok) { toast(r.message); return; } S.appts.find(x => x.id === id).status = r.data.status; renderStaff(); }); break;
    case 'apply-intl': { const ac = Math.round(idrGram(xauStats().last) / 1000) * 1000; api('PUT', '/api/staff/parameter', { acuan: ac }).then(r => { if (!r.ok) { toast(r.message); return; } Object.assign(params, r.data); renderTicker(); toast('Harga acuan 24K diperbarui ke ' + rp(params.acuan) + '.'); renderStaff(); }); break; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#auth').hidden) closeAuth(); else if (!$('#modal').hidden) closeModal(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('card')) { e.preventDefault(); openModal(e.target.dataset.id); }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form;
  if (kind === 'auth') doAuth(f);
  if (kind === 'appt') doAppt(f);
  if (kind === 'tradein') {
    const c = trCalc();
    if (c.berat <= 0) { toast('Isi berat perhiasan lebih dari 0.'); return; }
    requireLogin(async () => {
      const r = await api('POST', '/api/trade-in', { jenis: $('#trJenis').value, berat: c.berat, karat: c.karat, target: $('#trTarget').value || null });
      if (!r.ok) { toast(r.message); return; }
      toast('Pengajuan terkirim. Staff akan memeriksa perhiasan Anda.');
    });
  }
  if (kind === 'newprod') {
    const nama = $('#npN').value.trim(), w = parseFloat($('#npW').value), err = $('#npErr'); err.textContent = '';
    if (!nama) { err.textContent = 'Nama produk wajib diisi.'; return; }
    if (!(w > 0)) { err.textContent = 'Berat harus lebih dari 0.'; return; }
    const r = await api('POST', '/api/staff/produk', { nama: nama, jenis: $('#npJ').value, karat: $('#npK').value, berat: w, ongkos: Math.max(0, parseInt($('#npO').value, 10) || 0), batu: Math.max(0, parseInt($('#npB').value, 10) || 0), stok: Math.max(0, parseInt($('#npS').value, 10) || 0), tone: $('#npT').value });
    if (!r.ok) { err.textContent = r.message; return; }
    P.push(cP(r.data)); S.addOpen = false; toast('Produk baru ditambahkan ke katalog.'); renderStaff();
  }
  if (kind === 'params') {
    const ac = parseFloat($('#pcA').value), po = parseFloat($('#pcP').value), ku = parseFloat($('#pcK').value), err = $('#pcErr'); err.textContent = '';
    if (!(ac >= 100000)) { err.textContent = 'Harga acuan 24K per gram terlalu kecil. Periksa angkanya.'; return; }
    if (!(po >= 0 && po <= 50)) { err.textContent = 'Potongan trade-in harus antara 0 dan 50 persen.'; return; }
    if (!(ku >= 1000)) { err.textContent = 'Isi kurs USD/IDR yang valid.'; return; }
    const r = await api('PUT', '/api/staff/parameter', { acuan: ac, potong: po, kurs: ku });
    if (!r.ok) { err.textContent = r.message; return; }
    Object.assign(params, r.data); renderTicker(); toast('Parameter disimpan. Harga katalog diperbarui.'); renderStaff();
  }
  if (kind === 'trx') {
    const pid = $('#txP').value, nama = $('#txN').value.trim(), q = parseInt($('#txQ').value, 10) || 0, d = parseInt($('#txD').value, 10) || 0, err = $('#txErr'); err.textContent = '';
    if (!nama) { err.textContent = 'Isi nama pelanggan.'; return; }
    const p = prod(pid); if (!p) { err.textContent = 'Pilih perhiasan.'; return; }
    if (q < 1 || q > p.stok) { err.textContent = 'Jumlah harus 1 sampai ' + p.stok + ' sesuai stok.'; return; }
    const r = await api('POST', '/api/staff/transaksi', { nama: nama, produk: pid, qty: q, potong: d, bayar: $('#txB').value });
    if (!r.ok) { err.textContent = r.message; return; }
    p.stok -= q; S.trx.push(cN(r.data));
    toast('Transaksi dicatat. Stok berkurang ' + q + '.'); renderStaff();
  }
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'trRange') { $('#trBerat').value = e.target.value; trCalc(); }
  else if (id === 'trBerat') { const v = parseFloat(e.target.value); if (v >= 0.5 && v <= 100) $('#trRange').value = v; trCalc(); }
  else if (id === 'trKarat' || id === 'trTarget') trCalc();
  else if (id === 'pcA' || id === 'pcP') { $('#hpv').innerHTML = hargaPreview(parseFloat($('#pcA').value) || params.acuan, parseFloat($('#pcP').value) || 0); }
  else if (id === 'fQ') { S.q = e.target.value.trim().toLowerCase(); renderGrid(); }
  else if (id === 'fKarat') { S.karat = e.target.value; renderGrid(); }
  else if (id === 'fSort') { S.sort = e.target.value; renderGrid(); }
});

/* ---------- Mulai ---------- */
cardHover($('#grid'));
loadAll().then(() => { renderTicker(); showMode(); });
})();
