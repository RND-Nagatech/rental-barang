import Constants from "expo-constants";
import type {
  Booking,
  CatalogData,
  Category,
  CustomerOrder,
  CustomerProfile,
  HomeData,
  Item,
  OrderFilter,
  PaymentStatus,
  TransactionStatus,
} from "@/data/types";
import { rentalDays, todayISO } from "@/lib/format";

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
  deskripsi?: string | null;
  harga_sewa_per_hari?: number;
  deposit_default?: number;
  stok_total?: number;
  stok_tersedia?: number;
  stok_di_gudang?: number;
  status_aktif?: boolean;
  status?: string;
  satuan?: string;
};

type ApiCustomer = MongoDoc & {
  kode_customer: string;
  nama_customer: string;
  no_hp: string;
  alamat?: string | null;
};

type ApiRentalDetail = MongoDoc & {
  kode_barang: string;
  nama_barang: string;
  qty: number;
  harga_sewa_per_hari: number;
  jumlah_hari?: number;
  subtotal?: number;
};

type ApiRental = MongoDoc & {
  kode_rental: string;
  kode_customer: string;
  nama_customer: string;
  tanggal_mulai: string;
  tanggal_rencana_kembali: string;
  status: string;
  total_sewa?: number;
  deposit?: number;
  total_bayar?: number;
  sisa_tagihan?: number;
  catatan?: string | null;
  created_at?: string;
  detail?: ApiRentalDetail[];
};

type ApiHomeCategory = {
  kode_kategori: string;
  nama_kategori: string;
  icon_url: string;
};

type ApiHomeItem = {
  kode_barang: string;
  nama_barang: string;
  nama_kategori: string;
  thumbnail_url: string;
  harga_sewa_per_hari: number;
  satuan: string;
  status_display: "Tersedia" | "Stok Terbatas" | "Tidak Tersedia";
  rating: number;
  jumlah_disewa: number;
};

type ApiCatalogCategoryResponse = {
  success: boolean;
  data: {
    total: number;
    items: ApiHomeCategory[];
  };
};

type ApiCatalogItem = {
  kode_barang: string;
  nama_barang: string;
  kode_kategori: string;
  nama_kategori: string;
  thumbnail_url: string;
  harga_sewa_per_hari: number;
  satuan: string;
  rating: number;
  jumlah_disewa: number;
  status_display: "Tersedia" | "Sebagian Disewa" | "Tidak Tersedia";
};

type ApiCatalogItemResponse = {
  success: boolean;
  data: {
    total: number;
    items: ApiCatalogItem[];
  };
};

type ApiCustomerOrder = {
  id: string;
  kode_rental: string;
  tanggal_order: string;
  periode_mulai: string;
  periode_selesai: string;
  status_rental: string;
  status_display: CustomerOrder["status_display"];
  status_pembayaran: PaymentStatus;
  total_tagihan: number;
  total_bayar: number;
  sisa_tagihan: number;
  jumlah_jenis_barang: number;
  thumbnail_items: string[];
};

type ApiCustomerOrderResponse = {
  success: boolean;
  data: {
    total: number;
    items: ApiCustomerOrder[];
  };
};

type ApiCustomerProfileResponse = {
  success: boolean;
  data: CustomerProfile;
};

type ApiCustomerHelpResponse = {
  success: boolean;
  data: {
    title: string;
    whatsapp: string;
    faq: { pertanyaan: string; jawaban: string }[];
  };
};

type ApiCustomerAboutResponse = {
  success: boolean;
  data: {
    app_name: string;
    nama_usaha: string;
    versi: string;
    alamat: string;
    telepon: string;
    deskripsi: string;
  };
};

export type CustomerPaymentMethod = {
  id: string;
  kode_metode: string;
  nama_metode: string;
  tipe_metode: "bank_transfer" | "qris" | "e_wallet" | "cash";
  nama_bank: string;
  nomor_rekening: string;
  nama_pemilik: string;
  qr_image_url: string;
  instruksi_pembayaran: string;
};

type ApiCustomerPaymentMethodsResponse = {
  success: boolean;
  data: {
    total: number;
    items: CustomerPaymentMethod[];
  };
};

type ApiCustomerAuthResponse = {
  success: boolean;
  token: string;
  customer: CustomerProfile["customer"];
};

type ApiHomeResponse = {
  success: boolean;
  data: {
    app_name: string;
    headline: string;
    home_subheadline?: string;
    categories: ApiHomeCategory[];
    popular_items: ApiHomeItem[];
    ready_items: ApiHomeItem[];
  };
};

const emojiByCategory = (name?: string) => {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("camp") || lower.includes("outdoor") || lower.includes("tenda")) return "🏕️";
  if (lower.includes("sound") || lower.includes("audio") || lower.includes("speaker")) return "🔊";
  if (lower.includes("dekor") || lower.includes("wedding") || lower.includes("nikah")) return "💐";
  if (lower.includes("pesta") || lower.includes("event")) return "🎉";
  if (lower.includes("baju") || lower.includes("gaun") || lower.includes("jas")) return "👗";
  return "📦";
};

const toId = (doc: MongoDoc) => doc.id || doc._id;

const apiBaseFromHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (!host || host.includes("exp.direct") || host === "localhost" || host === "127.0.0.1") return null;
  return `http://${host}:5001/api`;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || apiBaseFromHost() || "http://localhost:5001/api";

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.pesan || "Request API gagal");
  }

  return json as T;
};

const authHeader = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

const mapStatusItem = (item: ApiItem): Item["status"] => {
  const stok = Number(item.stok_di_gudang ?? item.stok_tersedia ?? 0);
  if (item.status_aktif === false || item.status === "maintenance") return "Maintenance";
  if (item.status === "full_disewa" || stok <= 0) return "Habis";
  if (item.status === "disewa_sebagian") return "Sebagian Disewa";
  return "Tersedia";
};

const mapHomeStatusItem = (status: ApiHomeItem["status_display"]): Item["status"] => {
  if (status === "Tidak Tersedia") return "Habis";
  if (status === "Stok Terbatas") return "Sebagian Disewa";
  return "Tersedia";
};

const mapCatalogStatusItem = (status: ApiCatalogItem["status_display"]): Item["status"] => status;

const mapHomeItem = (item: ApiHomeItem): Item => ({
  id: item.kode_barang,
  kode_barang: item.kode_barang,
  nama_barang: item.nama_barang,
  kategoriId: item.nama_kategori,
  emoji: emojiByCategory(item.nama_kategori || item.nama_barang),
  imageUrl: item.thumbnail_url || "",
  deskripsi: "",
  harga_sewa_per_hari: Number(item.harga_sewa_per_hari || 0),
  deposit_default: 0,
  stok_tersedia: item.status_display === "Tidak Tersedia" ? 0 : 1,
  satuan: item.satuan || "unit",
  status: mapHomeStatusItem(item.status_display),
  rating: Number(item.rating || 0),
  totalDisewa: Number(item.jumlah_disewa || 0),
});

const mapCatalogItem = (item: ApiCatalogItem): Item => ({
  id: item.kode_barang,
  kode_barang: item.kode_barang,
  nama_barang: item.nama_barang,
  kategoriId: item.kode_kategori,
  emoji: emojiByCategory(item.nama_kategori || item.nama_barang),
  imageUrl: item.thumbnail_url || "",
  deskripsi: "",
  harga_sewa_per_hari: Number(item.harga_sewa_per_hari || 0),
  deposit_default: 0,
  stok_tersedia: item.status_display === "Tidak Tersedia" ? 0 : 1,
  satuan: item.satuan || "unit",
  status: mapCatalogStatusItem(item.status_display),
  rating: Number(item.rating || 0),
  totalDisewa: Number(item.jumlah_disewa || 0),
});

const mapStatusRental = (status?: string): TransactionStatus => {
  const map: Record<string, TransactionStatus> = {
    draft: "Menunggu Konfirmasi",
    booking: "Dikonfirmasi",
    siap_keluar: "Dikonfirmasi",
    sedang_disewa: "Sedang Disewa",
    serah_terima_kembali: "Sedang Disewa",
    selesai: "Selesai",
    batal: "Dibatalkan",
  };
  return map[status || ""] || "Menunggu Konfirmasi";
};

const mapStatusPembayaran = (rental: ApiRental): PaymentStatus => {
  const total = Number(rental.total_sewa || 0);
  const paid = Number(rental.total_bayar || 0);
  if (paid <= 0) return "Belum Bayar";
  return paid >= total ? "Lunas" : "DP";
};

export const mobileApi = {
  async loginCustomer(input: { identifier: string; password: string }): Promise<ApiCustomerAuthResponse> {
    return request<ApiCustomerAuthResponse>("/customer/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async registerCustomer(input: {
    nama_customer: string;
    no_hp: string;
    email: string;
    password: string;
    alamat?: string;
  }): Promise<ApiCustomerAuthResponse> {
    return request<ApiCustomerAuthResponse>("/customer/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getHome(): Promise<HomeData> {
    const response = await request<ApiHomeResponse>("/customer/home");
    const data = response.data;

    return {
      appName: data.app_name || "Rentory",
      headline: data.headline || "Sewa apa saja, kapan saja. Mudah & terpercaya.",
      subheadline: data.home_subheadline || "",
      categories: data.categories.map((cat) => ({
        id: cat.kode_kategori,
        kode: cat.kode_kategori,
        nama: cat.nama_kategori,
        deskripsi: "",
        emoji: emojiByCategory(cat.nama_kategori),
        iconUrl: cat.icon_url || "",
      })),
      popularItems: data.popular_items.map(mapHomeItem),
      readyItems: data.ready_items.map(mapHomeItem),
    };
  },

  async getCustomerCategories(): Promise<Category[]> {
    const response = await request<ApiCatalogCategoryResponse>("/customer/kategori");
    return response.data.items.map((cat) => ({
      id: cat.kode_kategori,
      kode: cat.kode_kategori,
      nama: cat.nama_kategori,
      deskripsi: "",
      emoji: emojiByCategory(cat.nama_kategori),
      iconUrl: cat.icon_url || "",
    }));
  },

  async getCustomerItems(params: { q?: string; kode_kategori?: string; page?: number; limit?: number } = {}): Promise<CatalogData> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.kode_kategori) query.set("kode_kategori", params.kode_kategori);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const suffix = query.toString() ? `?${query.toString()}` : "";
    const response = await request<ApiCatalogItemResponse>(`/customer/barang${suffix}`);
    return {
      total: Number(response.data.total || 0),
      items: response.data.items.map(mapCatalogItem),
    };
  },

  async getCustomerOrders(status: OrderFilter = "all", token?: string): Promise<{ total: number; items: CustomerOrder[] }> {
    const query = new URLSearchParams();
    query.set("status", status);
    const response = await request<ApiCustomerOrderResponse>(`/customer/orders?${query.toString()}`, {
      headers: authHeader(token),
    });
    return {
      total: Number(response.data.total || 0),
      items: response.data.items.map((item) => ({
        id: item.id || item.kode_rental,
        kode_rental: item.kode_rental,
        tanggal_order: item.tanggal_order,
        periode_mulai: item.periode_mulai,
        periode_selesai: item.periode_selesai,
        status_rental: item.status_rental,
        status_display: item.status_display,
        status_pembayaran: item.status_pembayaran,
        total_tagihan: Number(item.total_tagihan || 0),
        total_bayar: Number(item.total_bayar || 0),
        sisa_tagihan: Number(item.sisa_tagihan || 0),
        jumlah_jenis_barang: Number(item.jumlah_jenis_barang || 0),
        thumbnail_items: Array.isArray(item.thumbnail_items) ? item.thumbnail_items : [],
      })),
    };
  },

  async cancelCustomerOrder(id: string, token?: string) {
    return request<{ success: boolean; data: { id: string; kode_rental: string; status_rental: string; status_display: string } }>(
      `/customer/orders/${id}/cancel`,
      {
        method: "PATCH",
        headers: authHeader(token),
        body: JSON.stringify({ catatan: "Dibatalkan oleh customer" }),
      },
    );
  },

  async getCustomerProfile(token?: string): Promise<CustomerProfile> {
    const response = await request<ApiCustomerProfileResponse>("/customer/profile", {
      headers: authHeader(token),
    });
    return response.data;
  },

  async updateCustomerProfile(input: Partial<CustomerProfile["customer"]>, token?: string): Promise<CustomerProfile> {
    const response = await request<ApiCustomerProfileResponse>("/customer/profile", {
      method: "PUT",
      headers: authHeader(token),
      body: JSON.stringify(input),
    });
    return response.data;
  },

  async getCustomerAddresses(token?: string) {
    return request("/customer/addresses", {
      headers: authHeader(token),
    });
  },

  async getCustomerHelp() {
    return request<ApiCustomerHelpResponse>("/customer/help");
  },

  async getCustomerAbout() {
    return request<ApiCustomerAboutResponse>("/customer/about");
  },

  async getCustomerPaymentMethods() {
    return request<ApiCustomerPaymentMethodsResponse>("/customer/payment-methods");
  },

  async getCategories(): Promise<Category[]> {
    const response = await request<ApiList<ApiCategory>>("/kategori?status_aktif=true");
    return response.data.map((cat) => ({
      id: toId(cat),
      kode: cat.kode_kategori,
      nama: cat.nama_kategori,
      deskripsi: cat.deskripsi || "",
      emoji: emojiByCategory(cat.nama_kategori),
    }));
  },

  async getItems(): Promise<Item[]> {
    const response = await request<ApiList<ApiItem>>("/barang?status_aktif=true");
    return response.data.map((item) => {
      const category = typeof item.id_kategori === "object" ? item.id_kategori : null;
      const kategoriId = category ? toId(category) : String(item.id_kategori || "");
      return {
        id: toId(item),
        kode_barang: item.kode_barang,
        nama_barang: item.nama_barang,
        kategoriId,
        emoji: emojiByCategory(category?.nama_kategori || item.nama_barang),
        deskripsi: item.deskripsi || "Belum ada deskripsi barang.",
        harga_sewa_per_hari: Number(item.harga_sewa_per_hari || 0),
        deposit_default: Number(item.deposit_default || 0),
        stok_tersedia: Number(item.stok_di_gudang ?? item.stok_tersedia ?? 0),
        satuan: item.satuan || "unit",
        status: mapStatusItem(item),
        rating: 4.8,
        totalDisewa: 0,
      };
    });
  },

  async getRentals(): Promise<Booking[]> {
    const response = await request<ApiList<ApiRental>>("/rental");
    return response.data.map((rental) => mapRental(rental));
  },

  async createCustomer(input: { nama: string; telepon: string; alamat: string }): Promise<ApiCustomer> {
    const kode = `CUST-${Date.now().toString().slice(-8)}`;
    const response = await request<ApiSingle<ApiCustomer>>("/customer", {
      method: "POST",
      body: JSON.stringify({
        kode_customer: kode,
        nama_customer: input.nama,
        no_hp: input.telepon,
        alamat: input.alamat || null,
      }),
    });
    return response.data;
  },

  async findOrCreateCustomer(input: { nama: string; telepon: string; alamat: string }): Promise<ApiCustomer> {
    const cleanPhone = input.telepon.trim();
    const existing = await request<ApiList<ApiCustomer>>(`/customer?cari=${encodeURIComponent(cleanPhone)}`);
    const found = existing.data.find((customer) => customer.no_hp === cleanPhone) || existing.data[0];
    return found || this.createCustomer(input);
  },

  async createCheckout(input: {
    token: string;
    tanggal_mulai: string;
    tanggal_kembali: string;
    catatan: string;
    alamat: string;
    detail: { item: Item; qty: number }[];
  }): Promise<Booking> {
    const detail = input.detail.map(({ item, qty }) => ({
      kode_barang: item.kode_barang,
      qty,
    }));

    const response = await request<ApiSingle<ApiRental>>("/customer/checkout", {
      method: "POST",
      headers: authHeader(input.token),
      body: JSON.stringify({
        tanggal_mulai: input.tanggal_mulai,
        tanggal_rencana_kembali: input.tanggal_kembali,
        tanggal_keluar: input.tanggal_mulai,
        status: "booking",
        catatan: [input.catatan, input.alamat ? `Alamat: ${input.alamat}` : ""]
          .filter(Boolean)
          .join("\n"),
        detail,
        items: detail,
      }),
    });
    return mapRental(response.data);
  },

  async createPayment(input: {
    kode_rental: string;
    amount: number;
    tipe: "dp" | "pelunasan";
    metode: string;
  }) {
    await request("/pembayaran", {
      method: "POST",
      body: JSON.stringify({
        kode_rental: input.kode_rental,
        tanggal_bayar: todayISO(),
        tipe_bayar: input.tipe,
        metode_bayar: input.metode,
        jumlah_bayar: input.amount,
        catatan: "Pembayaran dari aplikasi customer",
      }),
    });
  },
};

export function mapRental(rental: ApiRental): Booking {
  const items =
    rental.detail?.map((line) => ({
      itemId: line.kode_barang,
      nama: line.nama_barang,
      emoji: emojiByCategory(line.nama_barang),
      qty: Number(line.qty || 0),
      harga_sewa: Number(line.harga_sewa_per_hari || 0),
    })) || [];

  return {
    id: toId(rental),
    kode: rental.kode_rental,
    tanggal_mulai: rental.tanggal_mulai,
    tanggal_kembali: rental.tanggal_rencana_kembali,
    items,
    total: Number(rental.total_sewa || 0),
    deposit: Number(rental.deposit || 0),
    status: mapStatusRental(rental.status),
    paymentStatus: mapStatusPembayaran(rental),
    terbayar: Number(rental.total_bayar || 0),
    catatan: rental.catatan || "",
    alamat: "",
    createdAt: rental.created_at || rental.tanggal_mulai,
  };
}
