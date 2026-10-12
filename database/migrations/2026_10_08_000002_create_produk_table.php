<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('produk', function (Blueprint $t) {
            $t->id();
            $t->string('kode', 30)->unique();
            $t->string('nama', 120);
            $t->string('jenis', 20)->index();      // cincin, kalung, gelang, anting, liontin
            $t->string('karat', 4);                // 24K, 22K, 18K, 17K, 16K, 9K
            $t->decimal('berat', 8, 2);            // gram
            $t->unsignedBigInteger('ongkos')->default(0);
            $t->unsignedBigInteger('batu')->default(0);
            $t->unsignedInteger('stok')->default(0);
            $t->boolean('aktif')->default(true);
            $t->text('deskripsi')->nullable();
            $t->json('model3d');                   // parameter model 3D untuk katalog
            $t->timestamps();
        });

        Schema::create('wishlist', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('produk_id')->constrained('produk')->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'produk_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlist');
        Schema::dropIfExists('produk');
    }
};
