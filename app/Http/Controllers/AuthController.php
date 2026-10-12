<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MemvalidasiJson;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    use MemvalidasiJson;

    public function register(Request $r)
    {
        $d = $this->cek($r, [
            'nama' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:6|max:100',
        ], [
            'password.min' => 'Password minimal 6 karakter.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan masuk.',
            'nama.required' => 'Nama wajib diisi.',
        ]);

        $u = User::create(['name' => $d['nama'], 'email' => $d['email'], 'password' => $d['password'], 'role' => 'pelanggan']);
        Auth::login($u);
        $r->session()->regenerate();
        return $this->sukses();
    }

    public function login(Request $r)
    {
        $d = $this->cek($r, ['email' => 'required|email', 'password' => 'required|string']);
        if (!Auth::attempt(['email' => $d['email'], 'password' => $d['password'], 'role' => 'pelanggan'])) {
            $this->gagal('Email atau password salah.', 422);
        }
        $r->session()->regenerate();
        return $this->sukses();
    }

    public function staff(Request $r)
    {
        $d = $this->cek($r, ['username' => 'required|string', 'password' => 'required|string']);
        if (!Auth::attempt(['username' => $d['username'], 'password' => $d['password']])) {
            $this->gagal('Username atau password salah. Periksa lagi lalu coba masuk.', 422);
        }
        if (!Auth::user()->isStaff()) {
            Auth::logout();
            $this->gagal('Username atau password salah. Periksa lagi lalu coba masuk.', 422);
        }
        $r->session()->regenerate();
        return $this->sukses();
    }

    public function logout(Request $r)
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();
        return response()->json(['ok' => true, 'csrf' => csrf_token()]);
    }

    private function sukses()
    {
        return response()->json(['ok' => true, 'csrf' => csrf_token()]);
    }
}
