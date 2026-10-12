<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $table = 'produk';
    protected $fillable = ['kode', 'nama', 'jenis', 'karat', 'berat', 'ongkos', 'batu', 'stok', 'aktif', 'deskripsi', 'model3d'];

    protected $casts = [
        'berat' => 'float',
        'ongkos' => 'integer',
        'batu' => 'integer',
        'stok' => 'integer',
        'aktif' => 'boolean',
        'model3d' => 'array',
    ];

    /** Bentuk yang dibaca frontend (public/js/app.js). */
    public function keFront(): array
    {
        return [
            'id' => (string) $this->id,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'jenis' => $this->jenis,
            'karat' => $this->karat,
            'berat' => $this->berat,
            'ongkos' => $this->ongkos,
            'batu' => $this->batu,
            'stok' => $this->stok,
            'aktif' => $this->aktif,
            'desc' => $this->deskripsi,
                        'm' => $this->model3d,
            'foto' => $this->fotoUtama(),
        ];
    }

    /** Foto asli produk: taruh di public/produk/{KODE}/utama.jpg (atau .webp/.png). Kosong = pakai model 3D. */
    public function fotoUtama(): ?string
    {
        foreach (['webp', 'jpg', 'jpeg', 'png'] as $ext) {
            $path = "produk/{$this->kode}/utama.{$ext}";
            if (file_exists(public_path($path))) {
                return asset($path) . '?v=' . filemtime(public_path($path));
            }
        }
        return null;
    }
}
