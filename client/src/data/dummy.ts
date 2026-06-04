import type {
  Category,
  Customer,
  Item,
  Payment,
  Transaction,
} from "./types";

const today = new Date();
function dayOffset(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const categories: Category[] = [
  { id: "cat-1", kode: "CMP", nama: "Camping", deskripsi: "Tenda, sleeping bag, peralatan outdoor", icon: "Tent" },
  { id: "cat-2", kode: "WED", nama: "Dekorasi Pernikahan", deskripsi: "Backdrop, bunga, kursi, pelaminan", icon: "Flower2" },
  { id: "cat-3", kode: "ATR", nama: "Attire", deskripsi: "Gaun, jas, kostum, aksesoris", icon: "Shirt" },
  { id: "cat-4", kode: "SND", nama: "Sound System", deskripsi: "Speaker, mixer, mic, lighting", icon: "Speaker" },
  { id: "cat-5", kode: "PRT", nama: "Alat Pesta", deskripsi: "Meja, kursi, tenda, catering set", icon: "PartyPopper" },
];

export const items: Item[] = [
  {
    id: "itm-1", kode_barang: "CMP-001", nama_barang: "Tenda Dome Kapasitas 4 Orang", kategoriId: "cat-1",
    foto: "🏕️", harga_sewa_per_hari: 75000, denda_per_hari: 25000, stok_total: 12, stok_tersedia: 8,
    deposit_default: 200000, status: "Disewa Sebagian", kondisi: "Baik",
    riwayat: [
      { id: "h1", tanggal: dayOffset(-20), transaksi: "TRX-1003", customer: "Budi Santoso", qty: 2, kondisiKembali: "Baik" },
      { id: "h2", tanggal: dayOffset(-45), transaksi: "TRX-0980", customer: "Sari Lestari", qty: 1, kondisiKembali: "Lecet Ringan" },
    ],
  },
  {
    id: "itm-2", kode_barang: "CMP-002", nama_barang: "Sleeping Bag Hangat", kategoriId: "cat-1",
    foto: "🛌", harga_sewa_per_hari: 25000, denda_per_hari: 10000, stok_total: 30, stok_tersedia: 22,
    deposit_default: 50000, status: "Disewa Sebagian", kondisi: "Baik", riwayat: [],
  },
  {
    id: "itm-3", kode_barang: "WED-001", nama_barang: "Backdrop Bunga Premium", kategoriId: "cat-2",
    foto: "💐", harga_sewa_per_hari: 500000, denda_per_hari: 150000, stok_total: 4, stok_tersedia: 2,
    deposit_default: 1000000, status: "Disewa Sebagian", kondisi: "Baik",
    riwayat: [
      { id: "h3", tanggal: dayOffset(-10), transaksi: "TRX-1010", customer: "Maya Putri", qty: 1, kondisiKembali: "Baik" },
    ],
  },
  {
    id: "itm-4", kode_barang: "WED-002", nama_barang: "Kursi Tiffany Gold", kategoriId: "cat-2",
    foto: "🪑", harga_sewa_per_hari: 15000, denda_per_hari: 8000, stok_total: 200, stok_tersedia: 140,
    deposit_default: 30000, status: "Disewa Sebagian", kondisi: "Baik", riwayat: [],
  },
  {
    id: "itm-5", kode_barang: "ATR-001", nama_barang: "Gaun Pengantin Mewah", kategoriId: "cat-3",
    foto: "👰", harga_sewa_per_hari: 350000, denda_per_hari: 100000, stok_total: 6, stok_tersedia: 4,
    deposit_default: 1500000, status: "Disewa Sebagian", kondisi: "Baik",
    riwayat: [
      { id: "h4", tanggal: dayOffset(-30), transaksi: "TRX-0995", customer: "Dewi Anggraini", qty: 1, kondisiKembali: "Baik" },
    ],
  },
  {
    id: "itm-6", kode_barang: "ATR-002", nama_barang: "Jas Pria Formal Slim Fit", kategoriId: "cat-3",
    foto: "🤵", harga_sewa_per_hari: 150000, denda_per_hari: 50000, stok_total: 15, stok_tersedia: 11,
    deposit_default: 500000, status: "Tersedia", kondisi: "Baik", riwayat: [],
  },
  {
    id: "itm-7", kode_barang: "SND-001", nama_barang: "Speaker Aktif 15 inch", kategoriId: "cat-4",
    foto: "🔊", harga_sewa_per_hari: 250000, denda_per_hari: 75000, stok_total: 8, stok_tersedia: 3,
    deposit_default: 1000000, status: "Disewa Sebagian", kondisi: "Baik",
    riwayat: [
      { id: "h5", tanggal: dayOffset(-5), transaksi: "TRX-1020", customer: "Andi Wijaya", qty: 2, kondisiKembali: "Baik" },
    ],
  },
  {
    id: "itm-8", kode_barang: "SND-002", nama_barang: "Mixer Audio 12 Channel", kategoriId: "cat-4",
    foto: "🎛️", harga_sewa_per_hari: 200000, denda_per_hari: 60000, stok_total: 5, stok_tersedia: 5,
    deposit_default: 800000, status: "Tersedia", kondisi: "Baik", riwayat: [],
  },
  {
    id: "itm-9", kode_barang: "PRT-001", nama_barang: "Tenda Roder 5x10m", kategoriId: "cat-5",
    foto: "⛺", harga_sewa_per_hari: 1200000, denda_per_hari: 300000, stok_total: 3, stok_tersedia: 0,
    deposit_default: 2000000, status: "Full Disewa", kondisi: "Baik", riwayat: [],
  },
  {
    id: "itm-10", kode_barang: "PRT-002", nama_barang: "Meja Bulat 10 Orang", kategoriId: "cat-5",
    foto: "🟤", harga_sewa_per_hari: 50000, denda_per_hari: 20000, stok_total: 40, stok_tersedia: 28,
    deposit_default: 100000, status: "Disewa Sebagian", kondisi: "Baik", riwayat: [],
  },
  {
    id: "itm-11", kode_barang: "SND-003", nama_barang: "Lampu Par LED Panggung", kategoriId: "cat-4",
    foto: "💡", harga_sewa_per_hari: 80000, denda_per_hari: 30000, stok_total: 20, stok_tersedia: 6,
    deposit_default: 150000, status: "Maintenance", kondisi: "Rusak Ringan", riwayat: [],
  },
  {
    id: "itm-12", kode_barang: "CMP-003", nama_barang: "Kompor Portable + Nesting", kategoriId: "cat-1",
    foto: "🔥", harga_sewa_per_hari: 35000, denda_per_hari: 15000, stok_total: 18, stok_tersedia: 15,
    deposit_default: 75000, status: "Tersedia", kondisi: "Baik", riwayat: [],
  },
];

export const customers: Customer[] = [
  { id: "cus-1", nama: "Budi Santoso", telepon: "0812-3456-7890", email: "budi.s@email.com", alamat: "Jl. Merdeka No. 12, Jakarta", ktp: "3171xxxxxxxx0001", totalTransaksi: 8 },
  { id: "cus-2", nama: "Sari Lestari", telepon: "0813-2222-1111", email: "sari.l@email.com", alamat: "Jl. Kenanga No. 5, Bandung", ktp: "3273xxxxxxxx0002", totalTransaksi: 3 },
  { id: "cus-3", nama: "Maya Putri", telepon: "0856-7788-9900", email: "maya.p@email.com", alamat: "Perum Griya Asri B-7, Bekasi", ktp: "3275xxxxxxxx0003", totalTransaksi: 5 },
  { id: "cus-4", nama: "Andi Wijaya", telepon: "0878-1234-5678", email: "andi.w@email.com", alamat: "Jl. Sudirman No. 88, Surabaya", ktp: "3578xxxxxxxx0004", totalTransaksi: 12 },
  { id: "cus-5", nama: "Dewi Anggraini", telepon: "0821-9999-0000", email: "dewi.a@email.com", alamat: "Jl. Diponegoro No. 3, Semarang", ktp: "3374xxxxxxxx0005", totalTransaksi: 2 },
  { id: "cus-6", nama: "Rahmat Hidayat", telepon: "0852-3344-5566", email: "rahmat.h@email.com", alamat: "Jl. Gatot Subroto No. 21, Medan", ktp: "1271xxxxxxxx0006", totalTransaksi: 6 },
];

function line(itemId: string, nama: string, qty: number, harga: number, opts: Partial<Transaction["items"][number]> = {}) {
  return {
    itemId, nama, qty, harga_sewa: harga,
    qty_disiapkan: opts.qty_disiapkan ?? 0,
    qty_keluar: opts.qty_keluar ?? 0,
    qty_kembali: opts.qty_kembali ?? 0,
    kondisi_awal: opts.kondisi_awal ?? ("Baik" as const),
    kondisi_kembali: opts.kondisi_kembali ?? ("Baik" as const),
    checklist: opts.checklist ?? false,
    catatan: opts.catatan ?? "",
  };
}

export const transactions: Transaction[] = [
  {
    id: "trx-1", kode: "TRX-1025", customerId: "cus-1",
    tanggal_mulai: dayOffset(2), tanggal_rencana_kembali: dayOffset(5),
    tanggal_keluar: null, tanggal_kembali: null,
    items: [line("itm-1", "Tenda Dome Kapasitas 4 Orang", 2, 75000), line("itm-2", "Sleeping Bag Hangat", 4, 25000)],
    jenis_jaminan: "Deposit Uang", nominal_jaminan: 500000, jenis_dokumen: "KTP",
    nomor_dokumen: "", foto_dokumen: [], status_jaminan: "Belum Diterima",
    diskon: 0,
    deposit_required: 500000,
    deposit_received: 0,
    deposit_received_date: null,
    deposit_status: "Belum Diterima",
    deposit_received_method: undefined,
    deposit_received_note: "",
    total: 750000,
    catatan: "Untuk acara camping keluarga", status: "Draft", paymentStatus: "Belum Bayar",
    terbayar: 0, dendaKeterlambatan: 0, dendaKerusakan: 0, dendaKehilangan: 0,
  },
  {
    id: "trx-2", kode: "TRX-1024", customerId: "cus-3",
    tanggal_mulai: dayOffset(1), tanggal_rencana_kembali: dayOffset(3),
    tanggal_keluar: null, tanggal_kembali: null,
    items: [line("itm-3", "Backdrop Bunga Premium", 1, 500000), line("itm-4", "Kursi Tiffany Gold", 50, 15000)],
    jenis_jaminan: "Deposit Uang", nominal_jaminan: 1500000, jenis_dokumen: "KTP",
    nomor_dokumen: "", foto_dokumen: [], status_jaminan: "Diterima",
    diskon: 100000,
    deposit_required: 1500000,
    deposit_received: 750000,
    deposit_received_date: dayOffset(-1),
    deposit_status: "Diterima",
    deposit_received_method: "Transfer",
    deposit_received_note: "Deposit dicatat saat barang keluar",
    total: 2150000,
    catatan: "Dekorasi pernikahan outdoor", status: "Booking", paymentStatus: "Dibayar Sebagian",
    terbayar: 750000, dendaKeterlambatan: 0, dendaKerusakan: 0, dendaKehilangan: 0,
  },
  {
    id: "trx-3", kode: "TRX-1023", customerId: "cus-5",
    tanggal_mulai: dayOffset(0), tanggal_rencana_kembali: dayOffset(2),
    tanggal_keluar: null, tanggal_kembali: null,
    items: [line("itm-5", "Gaun Pengantin Mewah", 1, 350000, { qty_disiapkan: 1, checklist: true })],
    jenis_jaminan: "Deposit + Dokumen", nominal_jaminan: 1500000, jenis_dokumen: "KTP",
    nomor_dokumen: "", foto_dokumen: [], status_jaminan: "Belum Diterima",
    diskon: 0,
    deposit_required: 1500000,
    deposit_received: 0,
    deposit_received_date: null,
    deposit_status: "Belum Diterima",
    deposit_received_method: undefined,
    deposit_received_note: "",
    total: 700000,
    catatan: "Fitting sudah dilakukan", status: "Siap Keluar", paymentStatus: "Dibayar Sebagian",
    terbayar: 350000, dendaKeterlambatan: 0, dendaKerusakan: 0, dendaKehilangan: 0,
  },
  {
    id: "trx-4", kode: "TRX-1022", customerId: "cus-4",
    tanggal_mulai: dayOffset(-3), tanggal_rencana_kembali: dayOffset(0),
    tanggal_keluar: dayOffset(-3), tanggal_kembali: null,
    items: [line("itm-7", "Speaker Aktif 15 inch", 2, 250000, { qty_disiapkan: 2, qty_keluar: 2, checklist: true, kondisi_awal: "Baik" })],
    jenis_jaminan: "Deposit + Dokumen", nominal_jaminan: 2000000, jenis_dokumen: "KTP",
    nomor_dokumen: "3171xxxxxxxx0001", foto_dokumen: ["dokumen_ktp_1022.jpg"], status_jaminan: "Diterima",
    diskon: 0,
    deposit_required: 2000000,
    deposit_received: 2000000,
    deposit_received_date: dayOffset(-3),
    deposit_status: "Diterima",
    deposit_received_method: "Tunai",
    deposit_received_note: "Deposit diterima penuh",
    total: 1500000,
    catatan: "Acara ulang tahun", status: "Sedang Disewa", paymentStatus: "Lunas",
    terbayar: 1500000, dendaKeterlambatan: 0, dendaKerusakan: 0, dendaKehilangan: 0,
  },
  {
    id: "trx-5", kode: "TRX-1021", customerId: "cus-6",
    tanggal_mulai: dayOffset(-7), tanggal_rencana_kembali: dayOffset(-2),
    tanggal_keluar: dayOffset(-7), tanggal_kembali: null,
    items: [line("itm-10", "Meja Bulat 10 Orang", 10, 50000, { qty_disiapkan: 10, qty_keluar: 10, checklist: true })],
    jenis_jaminan: "Dokumen", nominal_jaminan: 0, jenis_dokumen: "SIM",
    nomor_dokumen: "B1234567XYZ", foto_dokumen: ["dokumen_sim_1021.jpg"], status_jaminan: "Diterima",
    diskon: 0,
    deposit_required: 1000000,
    deposit_received: 1000000,
    deposit_received_date: dayOffset(-7),
    deposit_status: "Diterima",
    deposit_received_method: "Transfer",
    deposit_received_note: "Deposit diterima penuh",
    total: 2500000,
    catatan: "Terlambat dihubungi customer", status: "Sedang Disewa", paymentStatus: "Dibayar Sebagian",
    terbayar: 1250000, dendaKeterlambatan: 0, dendaKerusakan: 0, dendaKehilangan: 0,
  },
  {
    id: "trx-6", kode: "TRX-1020", customerId: "cus-2",
    tanggal_mulai: dayOffset(-12), tanggal_rencana_kembali: dayOffset(-8),
    tanggal_keluar: dayOffset(-12), tanggal_kembali: dayOffset(-8),
    items: [line("itm-6", "Jas Pria Formal Slim Fit", 3, 150000, { qty_disiapkan: 3, qty_keluar: 3, qty_kembali: 3, checklist: true })],
    jenis_jaminan: "Deposit Uang", nominal_jaminan: 1500000, jenis_dokumen: "KTP",
    nomor_dokumen: "", foto_dokumen: [], status_jaminan: "Dikembalikan",
    diskon: 50000,
    deposit_required: 1500000,
    deposit_received: 1500000,
    deposit_received_date: dayOffset(-12),
    deposit_status: "Dikembalikan",
    deposit_received_method: "Tunai",
    deposit_received_note: "Deposit dikembalikan penuh saat selesai",
    total: 1750000,
    catatan: "Selesai tepat waktu", status: "Selesai", paymentStatus: "Lunas",
    terbayar: 1750000, dendaKeterlambatan: 0, dendaKerusakan: 0, dendaKehilangan: 0,
  },
];

export const payments: Payment[] = [
  { id: "pay-1", transaksiId: "trx-2", tanggal: dayOffset(-2), tipe: "DP", metode: "Transfer", nominal: 750000, bukti: "bukti_dp_1024.jpg", catatan: "DP 35%" },
  { id: "pay-2", transaksiId: "trx-3", tanggal: dayOffset(-1), tipe: "DP", metode: "QRIS", nominal: 350000, bukti: "bukti_dp_1023.jpg", catatan: "DP 50%" },
  { id: "pay-3", transaksiId: "trx-4", tanggal: dayOffset(-3), tipe: "DP", metode: "Tunai", nominal: 750000, bukti: "-", catatan: "DP" },
  { id: "pay-4", transaksiId: "trx-4", tanggal: dayOffset(-3), tipe: "Pelunasan", metode: "Transfer", nominal: 750000, bukti: "bukti_lunas_1022.jpg", catatan: "Pelunasan saat barang keluar" },
  { id: "pay-5", transaksiId: "trx-5", tanggal: dayOffset(-7), tipe: "DP", metode: "Transfer", nominal: 1250000, bukti: "bukti_dp_1021.jpg", catatan: "DP 50%" },
  { id: "pay-6", transaksiId: "trx-6", tanggal: dayOffset(-12), tipe: "DP", metode: "Tunai", nominal: 875000, bukti: "-", catatan: "DP" },
  { id: "pay-7", transaksiId: "trx-6", tanggal: dayOffset(-8), tipe: "Pelunasan", metode: "Transfer", nominal: 875000, bukti: "bukti_lunas_1020.jpg", catatan: "Pelunasan + pengembalian deposit" },
];
