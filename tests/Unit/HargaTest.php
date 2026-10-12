<?php

namespace Tests\Unit;

use App\Support\Harga;
use PHPUnit\Framework\TestCase;

class HargaTest extends TestCase
{
    public function test_rumus_harga(): void
    {
        $h = new Harga(2450000, 7);
        $this->assertSame(2246446, (int) round($h->gramJual('22K')));
        $this->assertSame(10509000, $h->harga(4.5, '22K', 400000, 0));
        $this->assertSame(13684685, $h->estimasiTrade(8, '18K'));
    }
}
