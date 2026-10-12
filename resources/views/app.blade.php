<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>Mas Ringgit Gold Price Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,500;0,600;0,700;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Share+Tech+Mono&display=swap">
<link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>
<header class="top">
  <div class="wrap bar">
    <button type="button" class="brand" data-act="go" data-v="katalog" aria-label="Beranda Mas Ringgit">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs><linearGradient id="coinG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8dd88"/><stop offset=".55" stop-color="#d9a21f"/><stop offset="1" stop-color="#9a6a0a"/></linearGradient></defs>
        <circle cx="24" cy="24" r="22" fill="url(#coinG)"/>
        <circle cx="24" cy="24" r="18" fill="none" stroke="#7a4f05" stroke-width="1.5" stroke-dasharray="2 2.4"/>
        <rect x="18" y="18" width="12" height="12" fill="var(--bg)" stroke="#7a4f05" stroke-width="1.5"/>
        <text x="24" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="0" fill="#7a4f05">MR</text>
      </svg>
      <span><b>Mas Ringgit</b><small>Gold Price Tracker</small></span>
    </button>
    <nav class="nav" id="nav" aria-label="Menu utama"></nav>
    <div class="acct" id="acct"></div>
  </div>
  <div class="ticker"><div class="wrap" id="ticker"></div></div>
</header>

<main id="cust">
  <section id="v-katalog">
    <div class="wrap hero">
      <div>
        <p class="eyebrow">Toko emas · Surabaya</p>
        <h1 class="hl">Emas pilihan, <em>harga yang terang.</em></h1>
        <p class="lede">Lihat perhiasan dari semua sisi, cek harga per karat hari ini, hitung tukar tambah perhiasan lama, lalu atur janji temu sebelum datang ke toko.</p>
        <div class="btns">
          <button type="button" class="btn gold" data-act="scroll" data-t="koleksi">Lihat koleksi</button>
          <button type="button" class="btn" data-act="go" data-v="tradein">Simulasi trade-in</button>
        </div>
        <ul class="feats"><li>Katalog 3D</li><li>Harga per karat</li><li>Wishlist</li><li>Trade-in</li><li>Janji temu</li></ul>
      </div>
      <div class="stage velvet" id="stage">
        <div class="floor"></div>
        <div class="thumb" id="heroObj"></div>
        <div class="stampbig" id="heroStamp"></div>
        <div class="hint">GERAKKAN MOUSE UNTUK MEMUTAR</div>
      </div>
    </div>
    <div class="wrap sec" id="koleksi">
      <h2 class="sh">Koleksi <em>perhiasan</em></h2>
      <p class="lead">Arahkan mouse ke perhiasan untuk memutarnya. Klik untuk melihat dari dekat, lengkap dengan rincian harga.</p>
      <div class="filters">
        <div class="chips" id="fJenis" role="group" aria-label="Jenis perhiasan"></div>
        <div class="sp">
          <label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input class="in" id="fQ" type="search" placeholder="Cari perhiasan" autocomplete="off" aria-label="Cari perhiasan"></label>
          <select class="in" id="fKarat" aria-label="Kadar emas"></select>
          <select class="in" id="fSort" aria-label="Urutkan">
            <option value="def">Urutan toko</option>
            <option value="lo">Harga terendah</option>
            <option value="hi">Harga tertinggi</option>
            <option value="w">Berat terbesar</option>
          </select>
        </div>
      </div>
      <div class="grid" id="grid"></div>
    </div>
  </section>

  <section id="v-harga" class="wrap sec" hidden>
    <h2 class="sh">Harga emas <em>per karat</em></h2>
    <p class="lead">Harga acuan yang dipakai toko hari ini. Harga perhiasan dihitung dari berat, kadar, ongkos, dan nilai batu.</p>
    <div class="kgrid" id="kgrid"></div>
    <p class="disc" id="hargaNote"></p>
  </section>

  <section id="v-tradein" class="wrap sec" hidden>
    <h2 class="sh">Simulasi <em>trade-in</em></h2>
    <p class="lead">Perkirakan nilai perhiasan lama sebelum datang ke toko. Hasilnya estimasi, nilai akhir ditentukan setelah staff memeriksa perhiasan.</p>
    <div class="tr-grid">
      <div class="panel">
        <h3>Perhiasan lama</h3>
        <form class="form" id="trForm" data-form="tradein">
          <div class="grid2">
            <div class="fld"><label for="trJenis">Jenis</label>
              <select class="in" id="trJenis"><option>Cincin</option><option>Kalung</option><option>Gelang</option><option>Anting</option><option>Liontin</option><option>Lainnya</option></select></div>
            <div class="fld"><label for="trKarat">Kadar</label><select class="in" id="trKarat"></select></div>
          </div>
          <div class="fld"><label for="trBerat">Berat (gram)</label>
            <div class="range"><input type="range" id="trRange" min="0.5" max="100" step="0.1" value="8"><input class="in num" id="trBerat" type="number" min="0.1" max="500" step="0.1" value="8"></div></div>
          <div class="fld"><label for="trTarget">Ingin ditukar dengan (opsional)</label><select class="in" id="trTarget"></select></div>
          <div class="btns"><button type="submit" class="btn pri">Ajukan ke toko</button></div>
        </form>
      </div>
      <div>
        <div class="led" aria-live="polite">
          <small>Estimasi nilai trade-in</small>
          <div class="big" id="trVal">Rp0</div>
          <div class="row" id="trRows"></div>
        </div>
        <p class="disc">Nilai dihitung dari berat, kadar, harga acuan toko, dan potongan trade-in yang ditetapkan toko. Ini bukan nilai akhir transaksi.</p>
      </div>
    </div>
  </section>

  <section id="v-wishlist" class="wrap sec" hidden>
    <h2 class="sh">Wishlist <em>saya</em></h2>
    <p class="lead">Perhiasan yang Anda simpan. Buat janji temu untuk melihatnya langsung di toko.</p>
    <div id="wishBody"></div>
  </section>

  <section id="v-janji" class="wrap sec" hidden>
    <h2 class="sh">Janji <em>temu</em></h2>
    <p class="lead">Pilih tanggal dan waktu kunjungan. Staff akan mengonfirmasi janji temu Anda.</p>
    <div id="janjiBody"></div>
  </section>
</main>

<main id="staff" hidden>
  <div class="wrap sg">
    <aside class="side" id="side" aria-label="Menu staff"></aside>
    <div id="spanel" style="min-width:0"></div>
  </div>
</main>

<footer class="foot"><div class="wrap"><span><b>Mas Ringgit Gold Price Tracker</b> · Toko Emas Surabaya</span><span>Harga dan produk dikelola toko lewat panel staff.</span></div></footer>

<div class="overlay" id="modal" hidden role="dialog" aria-modal="true" aria-label="Detail perhiasan"><div class="sheet" id="sheet"></div></div>
<div class="overlay" id="auth" hidden role="dialog" aria-modal="true" aria-label="Masuk"><div class="sheet narrow" id="authSheet"></div></div>
<div class="toast" id="toast" role="status"></div>

<script src="{{ asset('js/engine.js') }}"></script>
<script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
