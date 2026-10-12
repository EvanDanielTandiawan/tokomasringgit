<?php

namespace Database\Seeders;

use App\Models\HargaEmasInternasional;
use App\Models\JanjiTemu;
use App\Models\Parameter;
use App\Models\Produk;
use App\Models\TradeIn;
use App\Models\Transaksi;
use App\Models\User;
use App\Support\Harga;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Parameter::simpan(Parameter::DEFAULT);
        $h = Harga::dariArray(Parameter::semua());

        // Akun staff/owner awal. GANTI passwordnya sebelum dipakai sungguhan.
        User::updateOrCreate(['username' => 'owner'], [
            'name' => 'Owner Mas Ringgit', 'email' => 'owner@masringgit.test', 'role' => 'owner',
            'password' => 'masringgit',
        ]);

        // Pelanggan contoh (password: demo1234)
        $pel = [];
        foreach (['Sinta Wijaya', 'Budi Santoso', 'Maya Lestari', 'Hendra Kurniawan', 'Linda Tan', 'Agus Prasetyo'] as $n) {
            $pel[$n] = User::updateOrCreate(['email' => strtolower(explode(' ', $n)[0]) . '@contoh.test'], [
                'name' => $n, 'role' => 'pelanggan', 'password' => 'demo1234',
            ]);
        }

        // Produk
        $katalog = [
            ['MR-CN-001', 'Cincin Solitaire Berlian', 'cincin', '18K', 3.2, 650000, 2800000, 3, 'Cincin emas putih dengan satu batu berlian bundar. Ringan dipakai harian, pas untuk lamaran.',
                ['kind' => 'ring', 'R' => 46, 'b' => 14, 't' => 5, 'gem' => ['type' => 'diamond', 'r' => 19, 'hc' => 10, 'hp' => 16], 'tone' => 'putih']],
            ['MR-CN-002', 'Cincin Kawin Polos', 'cincin', '22K', 4.5, 400000, 0, 8, 'Cincin kawin polos dengan permukaan licin dan tepi membulat. Nyaman dipakai setiap hari.',
                ['kind' => 'ring', 'R' => 46, 'b' => 18, 't' => 6, 'tone' => 'kuning']],
            ['MR-CN-003', 'Cincin Ruby Klasik', 'cincin', '18K', 3.8, 700000, 1500000, 2, 'Cincin emas kuning dengan batu ruby merah tua. Model klasik yang cocok untuk hadiah.',
                ['kind' => 'ring', 'R' => 46, 'b' => 14, 't' => 5, 'gem' => ['type' => 'ruby', 'r' => 18, 'hc' => 9, 'hp' => 15], 'tone' => 'kuning']],
            ['MR-KL-001', 'Kalung Rantai Tali', 'kalung', '18K', 12.4, 900000, 0, 4, 'Kalung rantai dengan mata rantai saling mengait. Kuat, jatuhnya rapi di leher.',
                ['kind' => 'chainU', 'tone' => 'kuning']],
            ['MR-KL-002', 'Kalung Liontin Hati', 'kalung', '18K', 5.8, 650000, 0, 5, 'Kalung emas rose dengan liontin hati yang mengilap. Pilihan manis untuk hadiah ulang tahun.',
                ['kind' => 'chainU', 'pend' => 'heart', 'tone' => 'rose']],
            ['MR-KL-003', 'Kalung Koin 24K', 'kalung', '24K', 8, 300000, 0, 1, 'Kalung dengan liontin koin emas murni. Cocok sebagai simpanan yang tetap bisa dipakai.',
                ['kind' => 'chainU', 'pend' => 'coin', 'tone' => 'kuning']],
            ['MR-GL-001', 'Gelang Bangle Bulat', 'gelang', '22K', 18, 700000, 0, 3, 'Gelang bangle bulat tanpa sambungan terlihat. Satu gelang saja sudah cukup tampil.',
                ['kind' => 'tube', 'R' => 60, 'd' => 12, 'tone' => 'kuning']],
            ['MR-GL-002', 'Gelang Rantai Rose', 'gelang', '17K', 9.6, 600000, 0, 6, 'Gelang rantai emas rose yang lentur di pergelangan tangan dan mudah dipadukan.',
                ['kind' => 'chainC', 'R' => 58, 'tone' => 'rose']],
            ['MR-GL-003', 'Gelang Manik Emas', 'gelang', '22K', 14.2, 800000, 0, 2, 'Gelang dengan manik emas bulat berjajar. Bobotnya terasa, tampilannya hangat.',
                ['kind' => 'beads', 'R' => 58, 'n' => 22, 'd' => 11, 'tone' => 'kuning']],
            ['MR-AN-001', 'Anting Hoop Klasik', 'anting', '18K', 3.1, 400000, 0, 7, 'Sepasang anting hoop tipis yang ringan. Cocok dipakai ke kantor maupun acara keluarga.',
                ['kind' => 'hoops', 'tone' => 'kuning']],
            ['MR-AN-002', 'Anting Tusuk Safir', 'anting', '18K', 2.4, 450000, 1200000, 4, 'Sepasang anting tusuk emas putih dengan batu safir biru berpotongan segi delapan.',
                ['kind' => 'studs', 'gem' => 'sapphire', 'tone' => 'putih']],
            ['MR-LN-001', 'Liontin Medali Ukir', 'liontin', '22K', 6.5, 500000, 0, 3, 'Liontin medali bulat dengan ukiran melingkar di bagian tengah. Tersedia tanpa rantai.',
                ['kind' => 'disc', 'tone' => 'kuning']],
        ];
        $p = [];
        foreach ($katalog as $k) {
            $p[$k[0]] = Produk::updateOrCreate(['kode' => $k[0]], [
                'nama' => $k[1], 'jenis' => $k[2], 'karat' => $k[3], 'berat' => $k[4], 'ongkos' => $k[5], 'batu' => $k[6],
                'stok' => $k[7], 'aktif' => true, 'deskripsi' => $k[8], 'model3d' => $k[9],
            ]);
        }

        // Janji temu (hari berikutnya yang bukan Minggu)
        $buka = function (int $n): string {
            $d = Carbon::today()->addDays($n);
            while ($d->isSunday()) {
                $d->addDay();
            }
            return $d->toDateString();
        };
        if (JanjiTemu::count() === 0) {
            JanjiTemu::create(['user_id' => $pel['Sinta Wijaya']->id, 'produk_id' => $p['MR-CN-001']->id, 'tanggal' => $buka(1), 'jam' => '11:00', 'keperluan' => 'Melihat produk', 'status' => 'Menunggu']);
            JanjiTemu::create(['user_id' => $pel['Budi Santoso']->id, 'produk_id' => null, 'tanggal' => $buka(2), 'jam' => '14:30', 'keperluan' => 'Trade-in', 'status' => 'Dikonfirmasi']);
            JanjiTemu::create(['user_id' => $pel['Maya Lestari']->id, 'produk_id' => $p['MR-GL-001']->id, 'tanggal' => $buka(3), 'jam' => '16:00', 'keperluan' => 'Konsultasi', 'status' => 'Menunggu']);
        }

        // Trade-in
        if (TradeIn::count() === 0) {
            TradeIn::create(['user_id' => $pel['Hendra Kurniawan']->id, 'jenis' => 'Kalung', 'berat' => 12.4, 'karat' => '18K', 'estimasi' => $h->estimasiTrade(12.4, '18K'), 'status' => 'Baru']);
            TradeIn::create(['user_id' => $pel['Linda Tan']->id, 'jenis' => 'Gelang', 'berat' => 20, 'karat' => '22K', 'estimasi' => $h->estimasiTrade(20, '22K'), 'status' => 'Diproses']);
            TradeIn::create(['user_id' => $pel['Agus Prasetyo']->id, 'jenis' => 'Cincin', 'berat' => 3.1, 'karat' => '17K', 'estimasi' => $h->estimasiTrade(3.1, '17K'),
                'status' => 'Selesai', 'berat_akhir' => 3, 'karat_akhir' => '17K', 'nilai_akhir' => $h->estimasiTrade(3, '17K')]);
        }

        // Transaksi (hari lalu, kode produk, qty, potongan trade-in, pelanggan, metode)
        if (Transaksi::count() === 0) {
            foreach ([[26, 'MR-CN-002', 1, 0, 'Dewi Anggraini', 'Transfer'], [21, 'MR-KL-001', 1, 0, 'Rudi Hartono', 'Tunai'],
                [17, 'MR-AN-001', 2, 0, 'Fitri Handayani', 'QRIS'], [12, 'MR-GL-001', 1, 1500000, 'Ibu Marlina', 'Tunai'],
                [8, 'MR-KL-002', 1, 0, 'Kevin Salim', 'Transfer'], [4, 'MR-CN-001', 1, 0, 'Natalia Gunawan', 'Transfer'],
                [2, 'MR-GL-003', 1, 2000000, 'Bapak Hadi', 'Tunai']] as $r) {
                $pr = $p[$r[1]];
                Transaksi::create([
                    'tanggal' => Carbon::today()->subDays($r[0])->toDateString(), 'nama_pelanggan' => $r[4], 'produk_id' => $pr->id,
                    'qty' => $r[2], 'potongan' => $r[3], 'metode' => $r[5],
                    'total' => $h->harga($pr->berat, $pr->karat, $pr->ongkos, $pr->batu) * $r[2] - $r[3],
                ]);
            }
        }

        // Harga emas internasional 30 hari (CONTOH, jalan acak). Ganti dengan data asli lewat `php artisan emas:catat`.
        if (HargaEmasInternasional::count() === 0) {
            $s = 777 % 2147483646 + 1;
            $v = 4520.0;
            for ($i = 0; $i < 30; $i++) {
                $s = $s * 16807 % 2147483647;
                $rnd = $s / 2147483647;
                $v *= 1 + ($rnd - 0.47) * 0.018;
                HargaEmasInternasional::create(['tanggal' => Carbon::today()->subDays(29 - $i)->toDateString(), 'usd_per_oz' => round($v * 10) / 10]);
            }
        }
    }
}
