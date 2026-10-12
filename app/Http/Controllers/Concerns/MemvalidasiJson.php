<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

trait MemvalidasiJson
{
    /** Validasi; jika gagal, kirim JSON {message} berisi pesan pertama (422). */
    protected function cek(Request $r, array $aturan, array $pesan = []): array
    {
        $v = Validator::make($r->all(), $aturan, $pesan + [
            'required' => ':attribute wajib diisi.',
            'numeric' => ':attribute harus berupa angka.',
            'integer' => ':attribute harus berupa bilangan bulat.',
            'min' => ':attribute minimal :min.',
            'max' => ':attribute maksimal :max.',
            'in' => ':attribute tidak valid.',
            'exists' => ':attribute tidak ditemukan.',
            'email' => 'Isi email yang valid, misalnya nama@email.com.',
            'unique' => ':attribute sudah dipakai.',
        ]);
        if ($v->fails()) {
            abort(response()->json(['message' => $v->errors()->first()], 422));
        }
        return $v->validated();
    }

    protected function gagal(string $pesan, int $kode = 422): never
    {
        abort(response()->json(['message' => $pesan], $kode));
    }

    protected function wajibMasuk(Request $r)
    {
        $u = $r->user();
        if (!$u) {
            $this->gagal('Silakan masuk terlebih dahulu.', 401);
        }
        return $u;
    }

    protected function wajibStaff(Request $r)
    {
        $u = $this->wajibMasuk($r);
        if (!$u->isStaff()) {
            $this->gagal('Hanya staff atau owner yang boleh melakukan ini.', 403);
        }
        return $u;
    }
}
