<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $table = 'transaksi';
    protected $fillable = ['tanggal', 'nama_pelanggan', 'produk_id', 'qty', 'potongan', 'metode', 'total', 'dicatat_oleh'];
    protected $casts = ['tanggal' => 'date', 'qty' => 'integer', 'potongan' => 'integer', 'total' => 'integer'];

    public const METODE = ['Tunai', 'Transfer', 'QRIS'];

    public function keFront(): array
    {
        return [
            'id' => (string) $this->id,
            'tgl' => $this->tanggal->format('Y-m-d'),
            'produk' => (string) $this->produk_id,
            'qty' => $this->qty,
            'potong' => $this->potongan,
            'nama' => $this->nama_pelanggan,
            'bayar' => $this->metode,
            'total' => $this->total,
        ];
    }
}
