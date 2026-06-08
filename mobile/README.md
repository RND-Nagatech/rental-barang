# Rentory — Aplikasi Customer (React Native + Expo)

Aplikasi mobile untuk **customer** Rentory: lihat-lihat barang, booking (transaksi rental),
dan pembayaran. Kodenya **terpisah** dari frontend web admin (folder ini sendiri).

Semua data masih **dummy** (tanpa backend), sesuai dengan web admin.

## Fitur

- **Beranda** — hero, pencarian, kategori, barang populer & siap disewa
- **Katalog** — filter kategori + pencarian barang
- **Detail Barang** — deskripsi, rating, harga, deposit, atur jumlah & periode
- **Keranjang** — atur tanggal sewa, qty, ringkasan biaya + deposit
- **Checkout** — data penyewa, alamat, catatan, ringkasan
- **Pembayaran** — skema DP 50% / Lunas, pilih metode (Transfer/QRIS/E-Wallet/COD), layar sukses
- **Pesanan Saya** — daftar transaksi + status & sisa tagihan
- **Profil** — statistik, menu akun

## Menjalankan

```bash
cd mobile
npm install        # atau: bun install
npx expo start     # scan QR dengan Expo Go (Android/iOS)
```

## Build APK (Android)

Gunakan EAS Build (butuh akun Expo gratis):

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview   # menghasilkan file .apk
```

Untuk build lokal cepat tanpa EAS, bisa juga `npx expo run:android` (butuh Android SDK terpasang).

## Struktur

```
mobile/
  app/                 # Expo Router (file-based routing)
    (tabs)/            # Beranda, Katalog, Keranjang, Pesanan, Profil
    barang/[id].tsx    # Detail barang
    checkout.tsx       # Checkout
    pembayaran/[id].tsx# Pembayaran
  src/
    components/        # Badge, Button, Card, ItemCard
    data/              # types & dummy data
    lib/               # format (rupiah, tanggal)
    store/             # CartContext (keranjang + booking + pembayaran)
    theme/             # warna, radius, shadow
```

## Stack

Expo SDK 52 · Expo Router 4 · React Native 0.76 · TypeScript · @expo/vector-icons · expo-linear-gradient
