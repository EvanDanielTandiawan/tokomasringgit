<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('janji_temu', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('produk_id')->nullable()->constrained('produk')->nullOnDelete();
            $t->date('tanggal');
            $t->string('jam', 5);
            $t->string('keperluan', 30);
            $t->string('status', 20)->default('Menunggu');
            $t->timestamps();
            $t->index(['tanggal', 'jam']);
        });

        Schema::create('trade_in', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('jenis', 20);
            $t->decimal('berat', 8, 2);
            $t->string('karat', 4);
            $t->unsignedBigInteger('estimasi');
            $t->foreignId('produk_target_id')->nullable()->constrained('produk')->nullOnDelete();
            $t->string('status', 20)->default('Baru');   // Baru, Diproses, Selesai
            $t->decimal('berat_akhir', 8, 2)->nullable();
            $t->string('karat_akhir', 4)->nullable();
            $t->unsignedBigInteger('nilai_akhir')->nullable();
            $t->timestamps();
        });

        Schema::create('transaksi', function (Blueprint $t) {
            $t->id();
            $t->date('tanggal')->index();
            $t->string('nama_pelanggan', 120);
            $t->foreignId('produk_id')->constrained('produk')->restrictOnDelete();
            $t->unsignedInteger('qty');
            $t->unsignedBigInteger('potongan')->default(0);   // potongan trade-in
            $t->string('metode', 20);
            $t->unsignedBigInteger('total');
            $t->foreignId('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('parameter', function (Blueprint $t) {
            $t->string('kunci', 30)->primary();   // acuan, potong, kurs
            $t->string('nilai', 30);
            $t->timestamps();
        });

        Schema::create('harga_emas_internasional', function (Blueprint $t) {
            $t->id();
            $t->date('tanggal')->unique();
            $t->decimal('usd_per_oz', 10, 2);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('harga_emas_internasional');
        Schema::dropIfExists('parameter');
        Schema::dropIfExists('transaksi');
        Schema::dropIfExists('trade_in');
        Schema::dropIfExists('janji_temu');
    }
};
