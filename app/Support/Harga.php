<?php

namespace App\Support;

/**
 * Rumus harga toko. Sama persis dengan rumus di public/js/app.js.
 *   harga jual / gram = acuan 24K * kadar / 99,9
 *   nilai trade-in / gram = harga jual / gram * (1 - potongan%)
 *   harga perhiasan = round(berat * harga jual / gram, ke ribuan) + ongkos + nilai batu
 */
class Harga
{
    public const KARAT = [
        '24K' => ['kadar' => 99.9, 'st' => '999'],
        '22K' => ['kadar' => 91.6, 'st' => '916'],
        '18K' => ['kadar' => 75.0, 'st' => '750'],
        '17K' => ['kadar' => 70.8, 'st' => '708'],
        '16K' => ['kadar' => 66.7, 'st' => '667'],
        '9K'  => ['kadar' => 37.5, 'st' => '375'],
    ];

    public function __construct(private float $acuan, private float $potong, private float $kurs = 16400)
    {
    }

    public static function dariArray(array $p): self
    {
        return new self((float) $p['acuan'], (float) $p['potong'], (float) $p['kurs']);
    }

    public static function daftarKarat(): array
    {
        return array_keys(self::KARAT);
    }

    public function gramJual(string $karat): float
    {
        return $this->acuan * self::KARAT[$karat]['kadar'] / 99.9;
    }

    public function gramTrade(string $karat): float
    {
        return $this->gramJual($karat) * (1 - $this->potong / 100);
    }

    public function emas(float $berat, string $karat): int
    {
        return (int) (round($berat * $this->gramJual($karat) / 1000) * 1000);
    }

    public function harga(float $berat, string $karat, int $ongkos, int $batu): int
    {
        return $this->emas($berat, $karat) + $ongkos + $batu;
    }

    public function estimasiTrade(float $berat, string $karat): int
    {
        return (int) round($berat * $this->gramTrade($karat));
    }
}
