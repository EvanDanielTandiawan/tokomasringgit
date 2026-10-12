# Mas Ringgit Gold Price Tracker (Laravel)

Folder ini adalah **lapisan aplikasi** untuk proyek Laravel 11/12 baru (tanpa `vendor/`).

## Pasang

```bash
composer create-project laravel/laravel masringgit
# salin isi folder ini ke atas proyek (timpa routes/web.php dan DatabaseSeeder.php)
cd masringgit
# di .env: APP_TIMEZONE=Asia/Jakarta  (DB default SQLite; untuk MySQL isi DB_*)
php artisan migrate --seed
php artisan serve        # buka http://127.0.0.1:8000
php artisan test         # opsional
```

## Akun awal (dari seeder)
- Staff/Owner: username `owner`, password `masringgit` (**ganti sebelum dipakai sungguhan**)
- Pelanggan contoh: `sinta@contoh.test`, `budi@contoh.test`, dst. dengan password `demo1234`

## Struktur
- `database/migrations/` : users (+role, username), produk, wishlist, janji_temu, trade_in, transaksi, parameter, harga_emas_internasional
- `app/Models/`, `app/Support/Harga.php` (rumus harga), `app/Http/Controllers/` (Auth, Api, Staff)
- `routes/web.php` : halaman + JSON API `/api/*` (sesi + CSRF)
- `resources/views/app.blade.php` + `public/js/*`, `public/css/style.css` : tampilan 3D
- `php artisan emas:catat 4550.5` : catat harga emas internasional hari ini (grafik 30 hari di panel staff). Data 30 hari dari seeder hanya contoh.

## Aturan penting
- Harga jual/gram = acuan 24K x kadar / 99,9; trade-in = harga jual x (1 - potongan%); harga produk = emas (dibulatkan ke ribuan) + ongkos + batu.
- Janji temu: tolak hari Minggu, tanggal lewat, dan jam yang sudah terisi.
- Produk yang sudah punya transaksi tidak bisa dihapus (nonaktifkan saja).
- Wishlist, janji temu, dan pengajuan trade-in wajib login pelanggan; panel staff wajib login staff/owner.
