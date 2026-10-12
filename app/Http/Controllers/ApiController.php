<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MemvalidasiJson;
use App\Models\HargaEmasInternasional;
use App\Models\JanjiTemu;
use App\Models\Parameter;
use App\Models\Produk;
use App\Models\TradeIn;
use App\Models\Transaksi;
use App\Support\Harga;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiController extends Controller
{
    use MemvalidasiJson;

    public const JAM = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];

    /** Semua data awal untuk frontend, sesuai peran pengguna. */
    public function bootstrap(Request $r)
    {
        $u = $r->user();
        $staff = $u && $u->isStaff();

        $produk = Produk::orderBy('id')
            ->when(!$staff, fn ($q) => $q->where('aktif', true))
            ->get()->map->keFront()->values();

        $out = [
            'user' => $u ? ['nama' => $u->name, 'email' => $u->email, 'role' => $u->role] : null,
            'params' => Parameter::semua(),
            'produk' => $produk,
            'wish' => [],
            'janji' => [],
            'trade' => [],
            'trx' => [],
            'xau' => [],
            'csrf' => csrf_token(),
        ];

        if ($u && !$staff) {
            $out['wish'] = $u->wishlist()->where('aktif', true)->pluck('produk.id')->map(fn ($i) => (string) $i)->values();
            $out['janji'] = JanjiTemu::with('user')->where('user_id', $u->id)->orderBy('tanggal')->orderBy('jam')->get()->map->keFront();
        }
        if ($staff) {
            $out['janji'] = JanjiTemu::with('user')->orderBy('tanggal')->orderBy('jam')->get()->map->keFront();
            $out['trade'] = TradeIn::with('user')->orderBy('id')->get()->map->keFront();
            $out['trx'] = Transaksi::orderBy('tanggal')->orderBy('id')->get()->map->keFront();
            $out['xau'] = HargaEmasInternasional::orderByDesc('tanggal')->limit(30)->get()->reverse()->values()
                ->map(fn ($x) => ['d' => $x->tanggal->format('Y-m-d'), 'v' => $x->usd_per_oz]);
        }
        return response()->json($out);
    }

    public function wishlist(Request $r, Produk $produk)
    {
        $u = $this->wajibMasuk($r);
        if (!$produk->aktif) {
            $this->gagal('Produk tidak tersedia.', 404);
        }
        $res = $u->wishlist()->toggle([$produk->id]);
        return response()->json(['aktif' => count($res['attached']) > 0]);
    }

    public function janjiBuat(Request $r)
    {
        $u = $this->wajibMasuk($r);
        if ($u->isStaff()) {
            $this->gagal('Janji temu dibuat oleh pelanggan.', 403);
        }
        $d = $this->cek($r, [
            'tgl' => 'required|date_format:Y-m-d',
            'jam' => 'required|in:' . implode(',', self::JAM),
            'perlu' => 'required|in:' . implode(',', JanjiTemu::KEPERLUAN),
            'produk' => 'nullable|integer|exists:produk,id',
        ], ['tgl.required' => 'Pilih tanggal kunjungan.', 'tgl.date_format' => 'Tanggal tidak valid.', 'jam.in' => 'Jam tidak valid.']);

        $tgl = Carbon::createFromFormat('Y-m-d', $d['tgl'])->startOfDay();
        if ($tgl->lt(now()->startOfDay())) {
            $this->gagal('Tanggal sudah lewat. Pilih hari ini atau sesudahnya.');
        }
        if ($tgl->isSunday()) {
            $this->gagal('Toko libur hari Minggu. Pilih hari lain.');
        }

        $janji = DB::transaction(function () use ($d, $u) {
            $terisi = JanjiTemu::where('tanggal', $d['tgl'])->where('jam', $d['jam'])
                ->where('status', '!=', 'Dibatalkan')->lockForUpdate()->exists();
            if ($terisi) {
                $this->gagal('Jam tersebut sudah terisi. Pilih jam lain.');
            }
            return JanjiTemu::create([
                'user_id' => $u->id, 'produk_id' => $d['produk'] ?? null, 'tanggal' => $d['tgl'],
                'jam' => $d['jam'], 'keperluan' => $d['perlu'], 'status' => 'Menunggu',
            ]);
        });
        return response()->json($janji->load('user')->keFront(), 201);
    }

    public function janjiStatus(Request $r, JanjiTemu $janji)
    {
        $u = $this->wajibMasuk($r);
        $d = $this->cek($r, ['status' => 'required|in:' . implode(',', JanjiTemu::STATUS)]);

        if (!$u->isStaff()) {
            if ($janji->user_id !== $u->id) {
                $this->gagal('Janji temu tidak ditemukan.', 404);
            }
            if ($d['status'] !== 'Dibatalkan' || !in_array($janji->status, ['Menunggu', 'Dikonfirmasi'], true)) {
                $this->gagal('Janji temu ini tidak bisa diubah.', 403);
            }
        }
        $janji->update(['status' => $d['status']]);
        return response()->json($janji->load('user')->keFront());
    }

    public function tradeBuat(Request $r)
    {
        $u = $this->wajibMasuk($r);
        $d = $this->cek($r, [
            'jenis' => 'required|in:' . implode(',', TradeIn::JENIS),
            'berat' => 'required|numeric|min:0.1|max:500',
            'karat' => 'required|in:' . implode(',', Harga::daftarKarat()),
            'target' => 'nullable|integer|exists:produk,id',
        ]);
        $h = Harga::dariArray(Parameter::semua());
        $t = TradeIn::create([
            'user_id' => $u->id, 'jenis' => $d['jenis'], 'berat' => $d['berat'], 'karat' => $d['karat'],
            'estimasi' => $h->estimasiTrade((float) $d['berat'], $d['karat']),
            'produk_target_id' => $d['target'] ?? null, 'status' => 'Baru',
        ]);
        return response()->json($t->load('user')->keFront(), 201);
    }
}
