import type { Booking, Category, Item } from "./types";

const today = new Date();
function dayOffset(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const categories: Category[] = [
  { id: "cat-1", kode: "CMP", nama: "Camping", deskripsi: "Tenda, sleeping bag, peralatan outdoor", emoji: "🏕️" },
  { id: "cat-2", kode: "WED", nama: "Dekorasi Pernikahan", deskripsi: "Backdrop, bunga, kursi, pelaminan", emoji: "💐" },
  { id: "cat-3", kode: "ATR", nama: "Attire", deskripsi: "Gaun, jas, kostum, aksesoris", emoji: "👗" },
  { id: "cat-4", kode: "SND", nama: "Sound System", deskripsi: "Speaker, mixer, mic, lighting", emoji: "🔊" },
  { id: "cat-5", kode: "PRT", nama: "Alat Pesta", deskripsi: "Meja, kursi, tenda, catering set", emoji: "🎉" },
];

export const items: Item[] = [
  {
    id: "itm-1", kode_barang: "CMP-001", nama_barang: "Tenda Dome Kapasitas 4 Orang", kategoriId: "cat-1",
    emoji: "🏕️", deskripsi: "Tenda dome anti air dengan double layer, cocok untuk keluarga. Mudah dipasang dalam 5 menit.",
    harga_sewa_per_hari: 75000, deposit_default: 200000, stok_tersedia: 8, status: "Tersedia", rating: 4.8, totalDisewa: 124,
  },
  {
    id: "itm-2", kode_barang: "CMP-002", nama_barang: "Sleeping Bag Hangat", kategoriId: "cat-1",
    emoji: "🛌", deskripsi: "Sleeping bag tebal tahan suhu hingga 5°C, bahan lembut dan ringan.",
    harga_sewa_per_hari: 25000, deposit_default: 50000, stok_tersedia: 22, status: "Tersedia", rating: 4.6, totalDisewa: 210,
  },
  {
    id: "itm-3", kode_barang: "WED-001", nama_barang: "Backdrop Bunga Premium", kategoriId: "cat-2",
    emoji: "💐", deskripsi: "Backdrop bunga artificial premium ukuran 3x2.5m, elegan untuk pelaminan.",
    harga_sewa_per_hari: 500000, deposit_default: 1000000, stok_tersedia: 2, status: "Sebagian Disewa", rating: 4.9, totalDisewa: 56,
  },
  {
    id: "itm-4", kode_barang: "WED-002", nama_barang: "Kursi Tiffany Gold", kategoriId: "cat-2",
    emoji: "🪑", deskripsi: "Kursi tiffany warna gold dengan bantalan empuk, kokoh dan mewah.",
    harga_sewa_per_hari: 15000, deposit_default: 30000, stok_tersedia: 140, status: "Tersedia", rating: 4.7, totalDisewa: 980,
  },
  {
    id: "itm-5", kode_barang: "ATR-001", nama_barang: "Gaun Pengantin Mewah", kategoriId: "cat-3",
    emoji: "👰", deskripsi: "Gaun pengantin ball gown dengan detail payet, tersedia fitting & alterasi.",
    harga_sewa_per_hari: 350000, deposit_default: 1500000, stok_tersedia: 4, status: "Tersedia", rating: 5.0, totalDisewa: 38,
  },
  {
    id: "itm-6", kode_barang: "ATR-002", nama_barang: "Jas Pria Formal Slim Fit", kategoriId: "cat-3",
    emoji: "🤵", deskripsi: "Jas formal slim fit lengkap dengan kemeja dan dasi, berbagai ukuran.",
    harga_sewa_per_hari: 150000, deposit_default: 500000, stok_tersedia: 11, status: "Tersedia", rating: 4.6, totalDisewa: 142,
  },
  {
    id: "itm-7", kode_barang: "SND-001", nama_barang: "Speaker Aktif 15 inch", kategoriId: "cat-4",
    emoji: "🔊", deskripsi: "Speaker aktif 15 inch 500W, suara jernih untuk acara indoor & outdoor.",
    harga_sewa_per_hari: 250000, deposit_default: 1000000, stok_tersedia: 3, status: "Sebagian Disewa", rating: 4.8, totalDisewa: 88,
  },
  {
    id: "itm-8", kode_barang: "SND-002", nama_barang: "Mixer Audio 12 Channel", kategoriId: "cat-4",
    emoji: "🎛️", deskripsi: "Mixer 12 channel dengan efek built-in, ideal untuk band & acara.",
    harga_sewa_per_hari: 200000, deposit_default: 800000, stok_tersedia: 5, status: "Tersedia", rating: 4.7, totalDisewa: 64,
  },
  {
    id: "itm-9", kode_barang: "PRT-001", nama_barang: "Tenda Roder 5x10m", kategoriId: "cat-5",
    emoji: "⛺", deskripsi: "Tenda roder besar tahan cuaca, kapasitas hingga 100 tamu.",
    harga_sewa_per_hari: 1200000, deposit_default: 2000000, stok_tersedia: 0, status: "Habis", rating: 4.9, totalDisewa: 41,
  },
  {
    id: "itm-10", kode_barang: "PRT-002", nama_barang: "Meja Bulat 10 Orang", kategoriId: "cat-5",
    emoji: "🟤", deskripsi: "Meja bulat kapasitas 10 orang, kuat dan mudah dilipat.",
    harga_sewa_per_hari: 50000, deposit_default: 100000, stok_tersedia: 28, status: "Tersedia", rating: 4.5, totalDisewa: 320,
  },
  {
    id: "itm-11", kode_barang: "SND-003", nama_barang: "Lampu Par LED Panggung", kategoriId: "cat-4",
    emoji: "💡", deskripsi: "Lampu par LED RGB dengan kontrol DMX, warna-warni untuk panggung.",
    harga_sewa_per_hari: 80000, deposit_default: 150000, stok_tersedia: 6, status: "Tersedia", rating: 4.6, totalDisewa: 110,
  },
  {
    id: "itm-12", kode_barang: "CMP-003", nama_barang: "Kompor Portable + Nesting", kategoriId: "cat-1",
    emoji: "🔥", deskripsi: "Kompor portable hemat gas lengkap dengan set nesting masak.",
    harga_sewa_per_hari: 35000, deposit_default: 75000, stok_tersedia: 15, status: "Tersedia", rating: 4.7, totalDisewa: 178,
  },
];

export const initialBookings: Booking[] = [
  {
    id: "bk-1", kode: "RNT-1024",
    tanggal_mulai: dayOffset(1), tanggal_kembali: dayOffset(3),
    items: [
      { itemId: "itm-3", nama: "Backdrop Bunga Premium", emoji: "💐", qty: 1, harga_sewa: 500000 },
      { itemId: "itm-4", nama: "Kursi Tiffany Gold", emoji: "🪑", qty: 50, harga_sewa: 15000 },
    ],
    total: 2500000, deposit: 1500000, status: "Dikonfirmasi", paymentStatus: "DP", terbayar: 750000,
    catatan: "Dekorasi pernikahan outdoor", alamat: "Gedung Serbaguna Melati, Bandung", createdAt: dayOffset(-2),
  },
  {
    id: "bk-2", kode: "RNT-1018",
    tanggal_mulai: dayOffset(-7), tanggal_kembali: dayOffset(-4),
    items: [
      { itemId: "itm-7", nama: "Speaker Aktif 15 inch", emoji: "🔊", qty: 2, harga_sewa: 250000 },
    ],
    total: 1500000, deposit: 2000000, status: "Selesai", paymentStatus: "Lunas", terbayar: 1500000,
    catatan: "Acara ulang tahun", alamat: "Jl. Sudirman No. 88, Surabaya", createdAt: dayOffset(-9),
  },
];

export function getItem(id: string): Item | undefined {
  return items.find((i) => i.id === id);
}
export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
