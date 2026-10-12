<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JanjiTemu extends Model
{
    protected $table = 'janji_temu';
    protected $fillable = ['user_id', 'produk_id', 'tanggal', 'jam', 'keperluan', 'status'];
    protected $casts = ['tanggal' => 'date'];

    public const STATUS = ['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];
    public const KEPERLUAN = ['Melihat produk', 'Trade-in', 'Konsultasi', 'Mengambil pesanan'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function keFront(): array
    {
        return [
            'id' => (string) $this->id,
            'nama' => $this->user?->name ?? '-',
            'tgl' => $this->tanggal->format('Y-m-d'),
            'jam' => $this->jam,
            'perlu' => $this->keperluan,
            'produk' => $this->produk_id ? (string) $this->produk_id : '',
            'status' => $this->status,
        ];
    }
}
