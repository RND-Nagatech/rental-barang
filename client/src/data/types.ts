export type ItemStatus = "Tersedia" | "Disewa Sebagian" | "Full Disewa" | "Maintenance";

export type ItemCondition = "Baik" | "Lecet Ringan" | "Rusak Ringan" | "Rusak Berat" | "Hilang";

export type TransactionStatus =
  | "Draft"
  | "Booking"
  | "Siap Keluar"
  | "Sedang Disewa"
  | "Serah Terima Kembali"
  | "Selesai"
  | "Batal";

export type PaymentStatus = "Belum Bayar" | "Dibayar Sebagian" | "Lunas";

export type PaymentType =
  | "DP"
  | "Tambah DP"
  | "Pelunasan"
  | "Denda"
  | "Charge"
  | "Refund Jaminan";
export type ChargeType = "Keterlambatan" | "Kerusakan" | "Kehilangan" | "Laundry/Cleaning" | "Lainnya";

export type DepositStatus =
  | "Belum Diterima"
  | "Diterima"
  | "Dikembalikan"
  | "Dipotong";

export type GuaranteeType =
  | "Belum Diisi"
  | "Deposit Uang"
  | "Dokumen"
  | "Deposit + Dokumen"
  | "Tanpa Jaminan";

export type DocumentType = "KTP" | "SIM" | "Paspor" | "Kartu Mahasiswa" | "Lainnya";

export type GuaranteeStatus =
  | "Belum Diterima"
  | "Diterima"
  | "Dikembalikan"
  | "Dipotong"
  | "Ditahan";

export type PaymentMethod = "Tunai" | "Transfer" | "QRIS" | "Kartu";

export interface Category {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  icon: string;
  icon_kategori?: string;
  gambar_kategori?: string;
  urutan_tampil?: number;
  tampil_di_apk?: boolean;
  status_aktif?: boolean;
}

export interface ItemHistory {
  id: string;
  tanggal: string;
  transaksi: string;
  customer: string;
  qty: number;
  kondisiKembali: ItemCondition;
}

export interface Item {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  kategoriId: string;
  foto: string;
  harga_sewa_per_hari: number;
  denda_per_hari: number;
  stok_total: number;
  stok_tersedia: number;
  stok_di_gudang: number;
  stok_sedang_keluar: number;
  stok_maintenance: number;
  stok_hilang: number;
  deposit_default: number;
  tampil_di_apk?: boolean;
  is_popular?: boolean;
  is_ready?: boolean;
  rating?: number;
  jumlah_disewa?: number;
  status: ItemStatus;
  kondisi: ItemCondition;
  riwayat: ItemHistory[];
}

export interface Customer {
  id: string;
  nama: string;
  telepon: string;
  email: string;
  alamat: string;
  ktp: string;
  totalTransaksi: number;
}

export interface TransactionLine {
  itemId: string;
  nama: string;
  qty: number;
  harga_sewa: number;
  qty_disiapkan: number;
  qty_keluar: number;
  qty_kembali: number;
  kondisi_awal: ItemCondition;
  kondisi_kembali: ItemCondition;
  foto_kondisi_awal?: string[];
  foto_kondisi_kembali?: string[];
  checklist: boolean;
  catatan: string;
}

export interface RentalCharge {
  id?: string;
  jenis_charge: ChargeType;
  nominal: number;
  catatan: string;
  potong_dari_jaminan: boolean;
}

export interface Transaction {
  id: string;
  kode: string;
  customerId: string;
  tanggal_mulai: string;
  tanggal_rencana_kembali: string;
  tanggal_keluar: string | null;
  tanggal_kembali: string | null;
  items: TransactionLine[];
  diskon: number;
  jenis_jaminan: GuaranteeType;
  nominal_jaminan: number;
  jenis_dokumen: DocumentType;
  nomor_dokumen?: string;
  foto_dokumen?: string[];
  status_jaminan: GuaranteeStatus;
  deposit_required: number;
  deposit_received: number;
  deposit_received_date: string | null;
  deposit_status: DepositStatus;
  deposit_received_method?: PaymentMethod;
  deposit_received_note?: string;
  total: number;
  catatan: string;
  status: TransactionStatus;
  paymentStatus: PaymentStatus;
  terbayar: number;
  dendaKeterlambatan: number;
  dendaKerusakan: number;
  dendaKehilangan: number;
  charges?: RentalCharge[];
  jenis_pembayaran?: PaymentType;
  metode_pembayaran?: PaymentMethod;
  nominal_bayar?: number;
  bukti_pembayaran?: string;
  catatan_pembayaran?: string;
}

export interface Payment {
  id: string;
  transaksiId: string;
  kodeRental?: string;
  tanggal: string;
  tipe: PaymentType;
  metode: PaymentMethod;
  nominal: number;
  bukti: string;
  catatan: string;
}
