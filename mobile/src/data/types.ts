export type ItemStatus = "Tersedia" | "Sebagian Disewa" | "Tidak Tersedia" | "Habis" | "Maintenance";
export type HomeItemStatus = "Tersedia" | "Stok Terbatas" | "Tidak Tersedia";

export type TransactionStatus =
  | "Menunggu Konfirmasi"
  | "Dikonfirmasi"
  | "Sedang Disewa"
  | "Selesai"
  | "Dibatalkan";

export type PaymentStatus = "Belum Bayar" | "DP" | "Lunas";

export interface Category {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  emoji: string;
  iconUrl?: string;
}

export interface Item {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategoriId: string;
  emoji: string;
  imageUrl?: string;
  deskripsi: string;
  harga_sewa_per_hari: number;
  deposit_default: number;
  stok_tersedia: number;
  satuan?: string;
  status: ItemStatus;
  rating: number;
  totalDisewa: number;
}

export interface HomeData {
  appName: string;
  headline: string;
  subheadline: string;
  categories: Category[];
  popularItems: Item[];
  readyItems: Item[];
}

export interface CatalogData {
  total: number;
  items: Item[];
}

export type OrderFilter = "all" | "active" | "selesai";
export type OrderDisplayStatus =
  | "Dikonfirmasi"
  | "Disiapkan"
  | "Aktif"
  | "Proses Kembali"
  | "Selesai"
  | "Batal";

export interface CustomerOrder {
  id: string;
  kode_rental: string;
  tanggal_order: string;
  periode_mulai: string;
  periode_selesai: string;
  status_rental: string;
  status_display: OrderDisplayStatus;
  status_pembayaran: PaymentStatus;
  total_tagihan: number;
  total_bayar: number;
  sisa_tagihan: number;
  jumlah_jenis_barang: number;
  thumbnail_items: string[];
}

export interface CustomerProfile {
  customer: {
    kode_customer: string;
    nama_customer: string;
    no_hp: string;
    email: string;
    alamat_default: string;
    foto_profile: string;
  };
  summary: {
    total_pesanan: number;
    pesanan_aktif: number;
    pesanan_selesai: number;
  };
}

export interface CartLine {
  itemId: string;
  qty: number;
  item?: Item;
}

export interface BookingLine {
  itemId: string;
  nama: string;
  emoji: string;
  qty: number;
  harga_sewa: number;
}

export interface Booking {
  id: string;
  kode: string;
  tanggal_mulai: string;
  tanggal_kembali: string;
  items: BookingLine[];
  total: number;
  deposit: number;
  status: TransactionStatus;
  paymentStatus: PaymentStatus;
  terbayar: number;
  catatan: string;
  alamat: string;
  createdAt: string;
}
