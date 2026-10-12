<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parameter extends Model
{
    protected $table = 'parameter';
    protected $primaryKey = 'kunci';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['kunci', 'nilai'];

    public const DEFAULT = ['acuan' => 2450000, 'potong' => 7, 'kurs' => 16400];

    /** @return array{acuan: float, potong: float, kurs: float} */
    public static function semua(): array
    {
        $db = static::query()->pluck('nilai', 'kunci')->all();
        $out = [];
        foreach (self::DEFAULT as $k => $v) {
            $out[$k] = isset($db[$k]) ? (float) $db[$k] : (float) $v;
        }
        return $out;
    }

    public static function simpan(array $nilai): void
    {
        foreach ($nilai as $k => $v) {
            if (array_key_exists($k, self::DEFAULT)) {
                static::updateOrCreate(['kunci' => $k], ['nilai' => (string) $v]);
            }
        }
    }
}
