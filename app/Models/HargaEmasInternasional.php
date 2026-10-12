<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaEmasInternasional extends Model
{
    protected $table = 'harga_emas_internasional';
    protected $fillable = ['tanggal', 'usd_per_oz'];
    protected $casts = ['tanggal' => 'date', 'usd_per_oz' => 'float'];
}
