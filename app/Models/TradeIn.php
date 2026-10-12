<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TradeIn extends Model
{
    protected $table = 'trade_in';
    protected $fillable = ['user_id', 'jenis', 'berat', 'karat', 'estimasi', 'produk_target_id', 'status', 'berat_akhir', 'karat_akhir', 'nilai_akhir'];
    protected $casts = ['berat' => 'float', 'berat_akhir' => 'float', 'estimasi' => 'integer', 'nilai_akhir' => 'integer'];

    public const JENIS = ['Cincin', 'Kalung', 'Gelang', 'Anting', 'Liontin', 'Lainnya'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function keFront(): array
    {
        return [
            'id' => (string) $this->id,
            'nama' => $this->user?->name ?? '-',
            'jenis' => $this->jenis,
            'berat' => $this->berat,
            'karat' => $this->karat,
            'est' => $this->estimasi,
            'status' => $this->status,
            'akhir' => $this->status === 'Selesai'
                ? ['berat' => $this->berat_akhir, 'karat' => $this->karat_akhir, 'nilai' => $this->nilai_akhir]
                : null,
        ];
    }
}
