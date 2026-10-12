<?php

namespace App\Console\Commands;

use App\Models\HargaEmasInternasional;
use Illuminate\Console\Command;

class CatatHargaEmas extends Command
{
    protected $signature = 'emas:catat {usd : Harga XAU/USD per troy ons} {--tanggal= : Format Y-m-d, default hari ini}';
    protected $description = 'Catat harga emas internasional (USD per troy ons) untuk grafik 30 hari di panel staff';

    public function handle(): int
    {
        $tgl = $this->option('tanggal') ?: now()->toDateString();
        HargaEmasInternasional::updateOrCreate(['tanggal' => $tgl], ['usd_per_oz' => (float) $this->argument('usd')]);
        $this->info("Harga emas {$tgl} dicatat: US$" . $this->argument('usd'));
        return self::SUCCESS;
    }
}
