<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MemvalidasiJson;
use App\Models\Parameter;
use App\Models\Produk;
use App\Models\TradeIn;
use App\Models\Transaksi;
use App\Support\Harga;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    use MemvalidasiJson;

    private const JENIS = ['cincin', 'kalung', 'gelang', 'anting', 'liontin'];

    /** Bentuk model 3D bawaan per jenis perhiasan (dipakai saat produk baru dibuat). */
    private const MODEL = [
        'cincin' => ['kind' => 'ring', 'R' => 46, 'b' => 16, 't' => 5.5],
        'kalung' => ['kind' => 'chainU'],
        'gelang' => ['kind' => 'tube', 'R' => 60, 'd' => 12],
        'anting' => ['kind' => 'hoops'],
        'liontin' => ['kind' => 'disc'],
    ];

    public function produkBuat(Request $r)
    {
        $this->wajibStaff($r);
        $d = $this->cek($r, [
            'nama' => 'required|string|max:120',
            'jenis' => 'required|in:' . implode(',', self::JENIS),
            'karat' => 'required|in:' . implode(',', Harga::daftarKarat()),
            'berat' => 'required|numeric|min:0.1|max:1000',
            'ongkos' => 'required|integer|min:0',
            'batu' => 'required|integer|min:0',
            'stok' => 'required|integer|min:0',
            'tone' => 'required|in:kuning,rose,putih',
        ], ['nama.required' => 'Nama produk wajib diisi.', 'berat.min' => 'Berat harus lebih dari 0.']);

        $p = Produk::create([
            'kode' => 'TMP' . uniqid(), 'nama' => $d['nama'], 'jenis' => $d['jenis'], 'karat' => $d['karat'],
            'berat' => $d['berat'], 'ongkos' => $d['ongkos'], 'batu' => $d['batu'], 'stok' => $d['stok'], 'aktif' => true,
            'deskripsi' => 'Perhiasan emas ' . $d['karat'] . ' koleksi toko.',
            'model3d' => self::MODEL[$d['jenis']] + ['tone' => $d['tone']],
        ]);
        $p->update(['kode' => sprintf('MR-%s-%03d', strtoupper(substr($d['jenis'], 0, 2)), $p->id)]);
        return response()->json($p->keFront(), 201);
    }

    public function produkUbah(Request $r, Produk $produk)
    {
        $this->wajibStaff($r);
        $d = $this->cek($r, ['stok' => 'sometimes|integer|min:0', 'aktif' => 'sometimes|boolean']);
        $produk->update($d);
        return response()->json($produk->keFront());
    }

    public function produkHapus(Request $r, Produk $produk)
    {
        $this->wajibStaff($r);
        if (Transaksi::where('produk_id', $produk->id)->exists()) {
            $this->gagal('Produk ini sudah punya transaksi dan tidak bisa dihapus. Matikan saklar "Aktif" saja.');
        }
        $produk->delete();
        return response()->json(['ok' => true]);
    }

    public function parameter(Request $r)
    {
        $this->wajibStaff($r);
        $d = $this->cek($r, [
            'acuan' => 'sometimes|numeric|min:100000',
            'potong' => 'sometimes|numeric|min:0|max:50',
            'kurs' => 'sometimes|numeric|min:1000',
        ], [
            'acuan.min' => 'Harga acuan 24K per gram terlalu kecil. Periksa angkanya.',
            'potong.min' => 'Potongan trade-in harus antara 0 dan 50 persen.',
            'potong.max' => 'Potongan trade-in harus antara 0 dan 50 persen.',
            'kurs.min' => 'Isi kurs USD/IDR yang valid.',
        ]);
        Parameter::simpan($d);
        return response()->json(Parameter::semua());
    }

    public function tradeProses(Request $r, TradeIn $trade)
    {
        $this->wajibStaff($r);
        if ($trade->status === 'Baru') {
            $trade->update(['status' => 'Diproses']);
        }
        return response()->json($trade->load('user')->keFront());
    }

    public function tradeSelesai(Request $r, TradeIn $trade)
    {
        $this->wajibStaff($r);
        $d = $this->cek($r, [
            'berat' => 'required|numeric|min:0.1|max:1000',
            'karat' => 'required|in:' . implode(',', Harga::daftarKarat()),
        ], ['berat.min' => 'Isi berat hasil pemeriksaan.']);
        if ($trade->status === 'Selesai') {
            $this->gagal('Trade-in ini sudah selesai.');
        }
        $h = Harga::dariArray(Parameter::semua());
        $trade->update([
            'status' => 'Selesai', 'berat_akhir' => $d['berat'], 'karat_akhir' => $d['karat'],
            'nilai_akhir' => $h->estimasiTrade((float) $d['berat'], $d['karat']),
        ]);
        return response()->json($trade->load('user')->keFront());
    }

    public function transaksiBuat(Request $r)
    {
        $staff = $this->wajibStaff($r);
        $d = $this->cek($r, [
            'nama' => 'required|string|max:120',
            'produk' => 'required|integer|exists:produk,id',
            'qty' => 'required|integer|min:1',
            'potong' => 'required|integer|min:0',
            'bayar' => 'required|in:' . implode(',', Transaksi::METODE),
        ], ['nama.required' => 'Isi nama pelanggan.', 'produk.required' => 'Pilih perhiasan.']);

        $h = Harga::dariArray(Parameter::semua());

        $trx = DB::transaction(function () use ($d, $h, $staff) {
            $p = Produk::lockForUpdate()->findOrFail($d['produk']);
            if (!$p->aktif) {
                $this->gagal('Produk tidak aktif.');
            }
            if ($d['qty'] > $p->stok) {
                $this->gagal('Jumlah harus 1 sampai ' . $p->stok . ' sesuai stok.');
            }
            $total = $h->harga($p->berat, $p->karat, $p->ongkos, $p->batu) * $d['qty'] - $d['potong'];
            if ($total < 0) {
                $this->gagal('Potongan melebihi harga.');
            }
            $p->decrement('stok', $d['qty']);
            return Transaksi::create([
                'tanggal' => now()->toDateString(), 'nama_pelanggan' => $d['nama'], 'produk_id' => $p->id,
                'qty' => $d['qty'], 'potongan' => $d['potong'], 'metode' => $d['bayar'], 'total' => $total,
                'dicatat_oleh' => $staff->id,
            ]);
        });
        return response()->json($trx->keFront(), 201);
    }
}
