import type {
  Category,
  Customer,
  Item,
  ItemCondition,
  ItemStatus,
  Payment,
  PaymentStatus,
  PaymentType,
  Transaction,
  TransactionStatus,
} from "@/data/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

type ApiList<T> = {
  sukses: boolean;
  pesan: string;
  jumlah?: number;
  data: T[];
};

type ApiSingle<T> = {
  sukses: boolean;
  pesan: string;
  data: T;
};

type MongoDoc = {
  _id: string;
  id?: string;
};

type ApiCategory = MongoDoc & {
  kode_kategori: string;
  nama_kategori: string;
  deskripsi?: string | null;
};

type ApiItem = MongoDoc & {
  kode_barang: string;
  nama_barang: string;
  id_kategori?: string | ApiCategory;
  foto?: string | null;
  harga_sewa_per_hari?: number;
  denda_per_hari?: number;
  deposit_default?: number;
  stok_total?: number;
  stok_tersedia?: number;
  stok_di_gudang?: number;
  stok_sedang_keluar?: number;
  stok_maintenance?: number;
  stok_hilang?: number;
  kondisi?: string;
  status_aktif?: boolean;
  satuan?: string;
  status?: string;
};

type ApiCustomer = MongoDoc & {
  kode_customer: string;
  nama_customer: string;
  no_hp?: string;
  email?: string | null;
  alamat?: string | null;
  nomor_identitas?: string | null;
};

type ApiRentalDetail = MongoDoc & {
  kode_rental: string;
  kode_barang: string;
  nama_barang: string;
  qty: number;
  harga_sewa_per_hari: number;
  jumlah_hari: number;
  subtotal: number;
  denda_per_hari: number;
  qty_disiapkan?: number;
  qty_keluar?: number;
  qty_kembali?: number;
  kondisi_awal?: ItemCondition;
  kondisi_kembali?: ItemCondition;
  foto_kondisi_awal?: string[];
  foto_kondisi_kembali?: string[];
  checklist?: boolean;
  catatan?: string | null;
};

type ApiRental = MongoDoc & {
  kode_rental: string;
  kode_customer: string;
  nama_customer: string;
  tanggal_mulai: string;
  tanggal_rencana_kembali: string;
  tanggal_keluar?: string | null;
  tanggal_kembali?: string | null;
  status: string;
  subtotal?: number;
  diskon?: number;
  deposit?: number;
  deposit_required?: number;
  deposit_received?: number;
  deposit_received_date?: string | null;
  deposit_received_method?: string | null;
  deposit_received_note?: string | null;
  deposit_status?: string;
  jenis_jaminan?: string;
  nominal_jaminan?: number;
  jenis_dokumen?: string | null;
  nomor_dokumen?: string | null;
  foto_dokumen?: string[];
  status_jaminan?: string;
  total_sewa?: number;
  total_denda?: number;
  total_bayar?: number;
  sisa_tagihan?: number;
  catatan?: string | null;
  detail?: ApiRentalDetail[];
};

type ApiPayment = MongoDoc & {
  kode_pembayaran: string;
  kode_rental: string;
  tanggal_bayar: string;
  tipe_bayar: string;
  metode_bayar: string;
  jumlah_bayar: number;
  bukti_bayar?: string | null;
  catatan?: string | null;
};

type ApiUpload = {
  nama_file: string;
  nama_asli: string;
  tipe_file: string;
  ukuran_file: number;
  url: string;
};

export type Pengaturan = {
  nama_usaha: string;
  telepon: string;
  alamat: string;
  denda_keterlambatan_default: number;
  deposit_minimum_default: number;
  jenis_jaminan_default: string;
  nominal_deposit_default: number;
  jenis_dokumen_default: string;
  wa_enabled: boolean;
  wa_connection_mode: "provider_api" | "web_qr";
  wa_provider_url: string;
  wa_api_key: string;
  wa_sender: string;
  wa_test_phone: string;
  wa_notif_booking_success: boolean;
  wa_reminder_pembayaran_hari_h: boolean;
  wa_reminder_pengembalian_hari_h: boolean;
  notifikasi_pengembalian: boolean;
  tandai_overdue_otomatis: boolean;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.pesan || "Request API gagal");
  }

  return json as T;
};

export const absoluteFileUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return `${BASE_URL}${url}`;
};

const toId = (doc: MongoDoc) => doc.id || doc._id;
const dateOnly = (value?: string | null) => {
  if (!value) return "";
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0];
  if (isoDate) return isoDate;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const statusBarang = (item: ApiItem): ItemStatus => {
  const stokGudang = Number(item.stok_di_gudang ?? item.stok_tersedia ?? 0);

  if (item.status_aktif === false) return "Maintenance";
  if (item.status === "full_disewa" || stokGudang === 0) return "Full Disewa";
  if (
    item.status === "disewa_sebagian" ||
    (item.stok_total && stokGudang < item.stok_total)
  ) {
    return "Disewa Sebagian";
  }
  return "Tersedia";
};

const kondisiBarang = (kondisi?: string): ItemCondition => {
  const map: Record<string, ItemCondition> = {
    baik: "Baik",
    lecet_ringan: "Lecet Ringan",
    rusak_ringan: "Rusak Ringan",
    rusak_berat: "Rusak Berat",
    hilang: "Hilang",
  };

  return map[kondisi || ""] || "Baik";
};

const kondisiApi = (kondisi: ItemCondition) => kondisi.toLowerCase().replace(/\s+/g, "_");

const statusTransaksi = (status?: string): TransactionStatus => {
  const map: Record<string, TransactionStatus> = {
    draft: "Draft",
    booking: "Booking",
    siap_keluar: "Siap Keluar",
    sedang_disewa: "Sedang Disewa",
    serah_terima_kembali: "Serah Terima Kembali",
    selesai: "Selesai",
    batal: "Dibatalkan",
    dibatalkan: "Dibatalkan",
  };

  return map[status || ""] || "Draft";
};

const statusApi = (status: TransactionStatus) =>
  status === "Dibatalkan" ? "batal" : status.toLowerCase().replace(/\s+/g, "_");

const tipeBayar = (tipe?: string): PaymentType => {
  const map: Record<string, PaymentType> = {
    dp: "DP",
    tambah_dp: "Tambah DP",
    pelunasan: "Pelunasan",
  };

  return map[tipe || ""] || "DP";
};

const statusDeposit = (status?: string) => {
  const map: Record<string, Transaction["deposit_status"]> = {
    belum_diterima: "Belum Diterima",
    diterima: "Diterima",
    dikembalikan: "Dikembalikan",
    dipotong: "Dipotong",
  };

  return map[status || ""] || "Belum Diterima";
};

const jenisJaminan = (jenis?: string): Transaction["jenis_jaminan"] => {
  const map: Record<string, Transaction["jenis_jaminan"]> = {
    deposit_uang: "Deposit Uang",
    dokumen: "Dokumen",
    deposit_dokumen: "Deposit + Dokumen",
    tanpa_jaminan: "Tanpa Jaminan",
  };

  return map[jenis || ""] || "Deposit Uang";
};

const jenisJaminanApi = (jenis: Transaction["jenis_jaminan"]) => {
  const map: Record<Transaction["jenis_jaminan"], string> = {
    "Deposit Uang": "deposit_uang",
    Dokumen: "dokumen",
    "Deposit + Dokumen": "deposit_dokumen",
    "Tanpa Jaminan": "tanpa_jaminan",
  };

  return map[jenis] || "deposit_uang";
};

const jenisDokumen = (jenis?: string): Transaction["jenis_dokumen"] => {
  const map: Record<string, Transaction["jenis_dokumen"]> = {
    ktp: "KTP",
    sim: "SIM",
    paspor: "Paspor",
    kartu_mahasiswa: "Kartu Mahasiswa",
    lainnya: "Lainnya",
  };

  return map[jenis || ""] || "KTP";
};

const jenisDokumenApi = (jenis: Transaction["jenis_dokumen"]) => {
  const map: Record<Transaction["jenis_dokumen"], string> = {
    KTP: "ktp",
    SIM: "sim",
    Paspor: "paspor",
    "Kartu Mahasiswa": "kartu_mahasiswa",
    Lainnya: "lainnya",
  };

  return map[jenis] || "ktp";
};

const statusJaminan = (status?: string): Transaction["status_jaminan"] => {
  const map: Record<string, Transaction["status_jaminan"]> = {
    belum_diterima: "Belum Diterima",
    diterima: "Diterima",
    dikembalikan: "Dikembalikan",
    dipotong: "Dipotong",
    ditahan: "Ditahan",
  };

  return map[status || ""] || "Belum Diterima";
};

const statusJaminanApi = (status: Transaction["status_jaminan"]) => {
  const map: Record<Transaction["status_jaminan"], string> = {
    "Belum Diterima": "belum_diterima",
    Diterima: "diterima",
    Dikembalikan: "dikembalikan",
    Dipotong: "dipotong",
    Ditahan: "ditahan",
  };

  return map[status] || "belum_diterima";
};

const metodePembayaran = (metode?: string): Transaction["deposit_received_method"] => {
  if (metode === "qris") return "QRIS";
  if (metode === "kartu") return "Kartu";
  if (metode === "transfer") return "Transfer";
  if (metode === "tunai") return "Tunai";
  return undefined;
};

const paymentStatus = (rental: ApiRental): PaymentStatus => {
  const total = Number(rental.total_sewa || 0) + Number(rental.total_denda || 0);
  const bayar = Number(rental.total_bayar || 0);

  if (bayar <= 0) return "Belum Bayar";
  if (bayar < total) return "Dibayar Sebagian";
  return "Lunas";
};

export const mapPayment = (payment: ApiPayment, transactions: Transaction[]): Payment => {
  const transaction = transactions.find((item) => item.kode === payment.kode_rental);

  return {
    id: toId(payment),
    transaksiId: transaction?.id || payment.kode_rental,
    tanggal: dateOnly(payment.tanggal_bayar),
    tipe: tipeBayar(payment.tipe_bayar),
    metode:
      payment.metode_bayar === "qris"
        ? "QRIS"
        : payment.metode_bayar === "kartu"
          ? "Kartu"
          : payment.metode_bayar === "transfer"
            ? "Transfer"
            : "Tunai",
    nominal: Number(payment.jumlah_bayar || 0),
    bukti: payment.bukti_bayar || "-",
    catatan: payment.catatan || "",
  };
};

export const mapCategory = (category: ApiCategory): Category => ({
  id: toId(category),
  kode: category.kode_kategori,
  nama: category.nama_kategori,
  deskripsi: category.deskripsi || "",
  icon: "Tag",
});

export const mapItem = (item: ApiItem): Item => {
  const kategori = item.id_kategori;
  const kategoriId = typeof kategori === "object" && kategori ? toId(kategori) : kategori || "";

  return {
    id: toId(item),
    kode_barang: item.kode_barang,
    nama_barang: item.nama_barang,
    satuan: item.satuan || "unit",
    kategoriId,
    foto: item.foto || "📦",
    harga_sewa_per_hari: Number(item.harga_sewa_per_hari || 0),
    denda_per_hari: Number(item.denda_per_hari || 0),
    stok_total: Number(item.stok_total || 0),
    stok_tersedia: Number(item.stok_tersedia ?? item.stok_di_gudang ?? 0),
    stok_di_gudang: Number(item.stok_di_gudang ?? item.stok_tersedia ?? 0),
    stok_sedang_keluar: Number(item.stok_sedang_keluar || 0),
    stok_maintenance: Number(item.stok_maintenance || 0),
    stok_hilang: Number(item.stok_hilang || 0),
    deposit_default: Number(item.deposit_default || 0),
    status: statusBarang(item),
    kondisi: kondisiBarang(item.kondisi),
    riwayat: [],
  };
};

export const mapCustomer = (customer: ApiCustomer, totalTransaksi = 0): Customer => ({
  id: toId(customer),
  nama: customer.nama_customer,
  telepon: customer.no_hp || "",
  email: customer.email || "",
  alamat: customer.alamat || "",
  ktp: customer.nomor_identitas || "",
  totalTransaksi,
});

export const mapRental = (rental: ApiRental, customers: Customer[], items: Item[]): Transaction => {
  const customer = customers.find((item) => item.nama === rental.nama_customer);
  const detail = rental.detail || [];

  return {
    id: toId(rental),
    kode: rental.kode_rental,
    customerId: customer?.id || rental.kode_customer,
    tanggal_mulai: dateOnly(rental.tanggal_mulai),
    tanggal_rencana_kembali: dateOnly(rental.tanggal_rencana_kembali),
    tanggal_keluar: dateOnly(rental.tanggal_keluar) || dateOnly(rental.tanggal_mulai) || null,
    tanggal_kembali: dateOnly(rental.tanggal_kembali) || null,
    items: detail.map((line) => {
      const item = items.find((barang) => barang.kode_barang === line.kode_barang);

      return {
        itemId: item?.id || line.kode_barang,
        nama: line.nama_barang,
        qty: Number(line.qty || 0),
        harga_sewa: Number(line.harga_sewa_per_hari || 0),
        qty_disiapkan: Number(line.qty_disiapkan || 0),
        qty_keluar: Number(line.qty_keluar || 0),
        qty_kembali: Number(line.qty_kembali || 0),
        kondisi_awal: line.kondisi_awal || "Baik",
        kondisi_kembali: line.kondisi_kembali || "Baik",
        foto_kondisi_awal: line.foto_kondisi_awal || [],
        foto_kondisi_kembali: line.foto_kondisi_kembali || [],
        checklist: Boolean(line.checklist),
        catatan: line.catatan || "",
      };
    }),
    diskon: Number(rental.diskon || 0),
    jenis_jaminan: jenisJaminan(rental.jenis_jaminan),
    nominal_jaminan: Number(rental.nominal_jaminan ?? rental.deposit_required ?? rental.deposit ?? 0),
    jenis_dokumen: jenisDokumen(rental.jenis_dokumen || undefined),
    nomor_dokumen: rental.nomor_dokumen || "",
    foto_dokumen: Array.isArray(rental.foto_dokumen) ? rental.foto_dokumen : [],
    status_jaminan: statusJaminan(rental.status_jaminan || rental.deposit_status),
    deposit_required: Number(rental.deposit_required ?? rental.deposit ?? 0),
    deposit_received: Number(rental.deposit_received || 0),
    deposit_received_date: dateOnly(rental.deposit_received_date) || null,
    deposit_status: statusDeposit(rental.deposit_status),
    deposit_received_method: metodePembayaran(rental.deposit_received_method || undefined),
    deposit_received_note: rental.deposit_received_note || "",
    total: Number(rental.total_sewa || 0),
    catatan: rental.catatan || "",
    status: statusTransaksi(rental.status),
    paymentStatus: paymentStatus(rental),
    terbayar: Number(rental.total_bayar || 0),
    dendaKeterlambatan: Number(rental.total_denda || 0),
    dendaKerusakan: 0,
    dendaKehilangan: 0,
  };
};

export const kategoriApi = {
  list: async () => mapList((await request<ApiList<ApiCategory>>("/kategori")).data, mapCategory),
  create: async (category: Omit<Category, "id">) =>
    mapCategory(
      (
        await request<ApiSingle<ApiCategory>>("/kategori", {
          method: "POST",
          body: JSON.stringify({
            kode_kategori: category.kode,
            nama_kategori: category.nama,
            deskripsi: category.deskripsi,
          }),
        })
      ).data,
    ),
  update: async (category: Category) =>
    mapCategory(
      (
        await request<ApiSingle<ApiCategory>>(`/kategori/${category.id}`, {
          method: "PUT",
          body: JSON.stringify({
            kode_kategori: category.kode,
            nama_kategori: category.nama,
            deskripsi: category.deskripsi,
          }),
        })
      ).data,
    ),
};

export const barangApi = {
  list: async () => mapList((await request<ApiList<ApiItem>>("/barang")).data, mapItem),
  create: async (item: Omit<Item, "id" | "riwayat">) =>
    mapItem(
      (
        await request<ApiSingle<ApiItem>>("/barang", {
          method: "POST",
          body: JSON.stringify({
            kode_barang: item.kode_barang,
            nama_barang: item.nama_barang,
            satuan: item.satuan,
            id_kategori: item.kategoriId,
            foto: item.foto,
            harga_sewa_per_hari: item.harga_sewa_per_hari,
            denda_per_hari: item.denda_per_hari,
            deposit_default: item.deposit_default,
            stok_total: item.stok_total,
            stok_tersedia: item.stok_tersedia,
            stok_di_gudang: item.stok_di_gudang,
            stok_sedang_keluar: item.stok_sedang_keluar,
            stok_maintenance: item.stok_maintenance,
            stok_hilang: item.stok_hilang,
            kondisi: kondisiApi(item.kondisi),
            status_aktif: item.status !== "Maintenance",
          }),
        })
      ).data,
    ),
  update: async (item: Item) =>
    mapItem(
      (
        await request<ApiSingle<ApiItem>>(`/barang/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({
            kode_barang: item.kode_barang,
            nama_barang: item.nama_barang,
            satuan: item.satuan,
            id_kategori: item.kategoriId,
            foto: item.foto,
            harga_sewa_per_hari: item.harga_sewa_per_hari,
            denda_per_hari: item.denda_per_hari,
            deposit_default: item.deposit_default,
            stok_total: item.stok_total,
            stok_tersedia: item.stok_tersedia,
            stok_di_gudang: item.stok_di_gudang,
            stok_sedang_keluar: item.stok_sedang_keluar,
            stok_maintenance: item.stok_maintenance,
            stok_hilang: item.stok_hilang,
            kondisi: kondisiApi(item.kondisi),
            status_aktif: item.status !== "Maintenance",
          }),
        })
      ).data,
    ),
};

export const customerApi = {
  list: async () => mapList((await request<ApiList<ApiCustomer>>("/customer")).data, mapCustomer),
  create: async (customer: Omit<Customer, "id" | "totalTransaksi">) =>
    mapCustomer(
      (
        await request<ApiSingle<ApiCustomer>>("/customer", {
          method: "POST",
          body: JSON.stringify({
            kode_customer: `CUS-${Date.now()}`,
            nama_customer: customer.nama,
            no_hp: customer.telepon,
            email: customer.email,
            alamat: customer.alamat,
            nomor_identitas: customer.ktp,
          }),
        })
      ).data,
    ),
  update: async (customer: Customer) =>
    mapCustomer(
      (
        await request<ApiSingle<ApiCustomer>>(`/customer/${customer.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nama_customer: customer.nama,
            no_hp: customer.telepon,
            email: customer.email,
            alamat: customer.alamat,
            nomor_identitas: customer.ktp,
          }),
        })
      ).data,
      customer.totalTransaksi,
    ),
};

export const rentalApi = {
  listRaw: async () => (await request<ApiList<ApiRental>>("/rental")).data,
  create: async (transaction: Omit<Transaction, "id">, customers: Customer[], items: Item[]) => {
    const customer = customers.find((item) => item.id === transaction.customerId);

    if (!customer) throw new Error("Customer tidak ditemukan");

    return (
      await request<ApiSingle<ApiRental>>("/rental", {
        method: "POST",
        body: JSON.stringify({
          kode_customer: customer.id.startsWith("CUS-") ? customer.id : undefined,
          nama_customer: customer.nama,
          customerId: customer.id,
          tanggal_mulai: transaction.tanggal_mulai,
          tanggal_rencana_kembali: transaction.tanggal_rencana_kembali,
          diskon: transaction.diskon,
          jenis_jaminan: jenisJaminanApi(transaction.jenis_jaminan),
          nominal_jaminan: transaction.nominal_jaminan,
          jenis_dokumen: jenisDokumenApi(transaction.jenis_dokumen),
          deposit_required: transaction.deposit_required,
          total_bayar: transaction.nominal_bayar ?? transaction.terbayar,
          nominal_bayar: transaction.nominal_bayar ?? transaction.terbayar,
          metode_pembayaran: transaction.metode_pembayaran,
          bukti_pembayaran: transaction.bukti_pembayaran,
          catatan: transaction.catatan,
          detail: transaction.items.map((line) => {
            const item = items.find((barang) => barang.id === line.itemId);

            return {
              itemId: line.itemId,
              kode_barang: item?.kode_barang,
              qty: line.qty,
              qty_disiapkan: line.qty_disiapkan,
              qty_keluar: line.qty_keluar,
              qty_kembali: line.qty_kembali,
              kondisi_awal: line.kondisi_awal,
              kondisi_kembali: line.kondisi_kembali,
              foto_kondisi_awal: line.foto_kondisi_awal || [],
              foto_kondisi_kembali: line.foto_kondisi_kembali || [],
              checklist: line.checklist,
              catatan: line.catatan,
            };
          }),
        }),
      })
    ).data;
  },
  update: async (transaction: Transaction, customers: Customer[], items: Item[]) => {
    const customer = customers.find((item) => item.id === transaction.customerId);

    return (
      await request<ApiSingle<ApiRental>>(`/rental/${transaction.id}`, {
        method: "PUT",
        body: JSON.stringify({
          customerId: customer?.id,
          tanggal_mulai: transaction.tanggal_mulai,
          tanggal_rencana_kembali: transaction.tanggal_rencana_kembali,
          tanggal_keluar: transaction.tanggal_keluar,
          tanggal_kembali: transaction.tanggal_kembali,
          diskon: transaction.diskon,
          jenis_jaminan: jenisJaminanApi(transaction.jenis_jaminan),
          nominal_jaminan: transaction.nominal_jaminan,
          jenis_dokumen: jenisDokumenApi(transaction.jenis_dokumen),
          nomor_dokumen: transaction.nomor_dokumen,
          foto_dokumen: transaction.foto_dokumen || [],
          status_jaminan: statusJaminanApi(transaction.status_jaminan),
          deposit_required: transaction.deposit_required,
          deposit_received: transaction.deposit_received,
          deposit_received_date: transaction.deposit_received_date,
          deposit_received_method: transaction.deposit_received_method,
          deposit_received_note: transaction.deposit_received_note,
          total_bayar: transaction.terbayar,
          total_denda:
            transaction.dendaKeterlambatan +
            transaction.dendaKerusakan +
            transaction.dendaKehilangan,
          catatan: transaction.catatan,
          status: statusApi(transaction.status),
          detail: transaction.items.map((line) => {
            const item = items.find((barang) => barang.id === line.itemId);

            return {
              itemId: line.itemId,
              kode_barang: item?.kode_barang,
              qty: line.qty,
              qty_disiapkan: line.qty_disiapkan,
              qty_keluar: line.qty_keluar,
              qty_kembali: line.qty_kembali,
              kondisi_awal: line.kondisi_awal,
              kondisi_kembali: line.kondisi_kembali,
              foto_kondisi_awal: line.foto_kondisi_awal || [],
              foto_kondisi_kembali: line.foto_kondisi_kembali || [],
              checklist: line.checklist,
              catatan: line.catatan,
            };
          }),
        }),
      })
    ).data;
  },
  setStatus: async (id: string, status: TransactionStatus) =>
    (
      await request<ApiSingle<ApiRental>>(`/rental/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusApi(status) }),
      })
    ).data,
};

export const pembayaranApi = {
  listRaw: async () => (await request<ApiList<ApiPayment>>("/pembayaran")).data,
  create: async (payment: Omit<Payment, "id">, transactions: Transaction[]) => {
    const transaction = transactions.find((item) => item.id === payment.transaksiId);
    const kodeRental = transaction?.kode || payment.kodeRental || payment.transaksiId;

    if (!kodeRental) throw new Error("Kode rental wajib diisi");

    return (
      await request<ApiSingle<ApiPayment>>("/pembayaran", {
        method: "POST",
        body: JSON.stringify({
          kode_rental: kodeRental,
          tanggal_bayar: payment.tanggal,
          tipe_bayar: payment.tipe,
          metode_bayar: payment.metode,
          jumlah_bayar: payment.nominal,
          bukti_bayar: payment.bukti,
          catatan: payment.catatan,
        }),
      })
    ).data;
  },
};

export const uploadApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(json?.pesan || "Upload file gagal");
    }

    return json.data as ApiUpload;
  },
};

export const laporanApi = {
  exportUrl: () => `${API_URL}/laporan/export`,
};

export const pengaturanApi = {
  get: async () => (await request<ApiSingle<Pengaturan>>("/pengaturan")).data,
  update: async (pengaturan: Pengaturan) =>
    (
      await request<ApiSingle<Pengaturan>>("/pengaturan", {
        method: "PUT",
        body: JSON.stringify(pengaturan),
      })
    ).data,
  waTest: async (no_hp: string, pesan?: string) =>
    request<ApiSingle<{ sukses: boolean }>>("/pengaturan/wa/test", {
      method: "POST",
      body: JSON.stringify({ no_hp, pesan }),
    }),
  waProcessReminders: async () =>
    request<ApiSingle<{ booking: number; pembayaran: number; pengembalian: number }>>(
      "/pengaturan/wa/process-reminders",
      {
        method: "POST",
      },
    ),
  waWebStart: async () =>
    request<ApiSingle<{ status: string; qrDataUrl?: string; lastError?: string }>>(
      "/pengaturan/wa/web/start",
      {
        method: "POST",
      },
    ),
  waWebStatus: async () =>
    request<ApiSingle<{ status: string; qrDataUrl?: string; lastError?: string }>>(
      "/pengaturan/wa/web/status",
    ),
  waWebDisconnect: async () =>
    request<ApiSingle<{ status: string; qrDataUrl?: string; lastError?: string }>>(
      "/pengaturan/wa/web/disconnect",
      {
        method: "POST",
      },
    ),
};

const mapList = <T, R>(list: T[], mapper: (item: T) => R): R[] => list.map(mapper);
