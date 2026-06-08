import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { categories as dummyCategories, items as dummyItems } from "@/data/dummy";
import type { Booking, CartLine, Category, Item } from "@/data/types";
import { rentalDays, todayISO, toISODate } from "@/lib/format";
import { API_URL, mobileApi } from "@/lib/api";
import { useAuth } from "@/store/AuthContext";

interface CartContextShape {
  categories: Category[];
  items: Item[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  apiUrl: string;
  cart: CartLine[];
  startDate: string;
  endDate: string;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  refreshData: () => Promise<void>;
  getItem: (itemId: string) => Item | undefined;
  getCategory: (categoryId: string) => Category | undefined;
  addToCart: (itemOrId: string | Item, qty?: number) => void;
  setQty: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartDays: number;
  cartSubtotal: number;
  cartDeposit: number;
  createBooking: (info: { catatan: string; alamat: string }) => Promise<Booking>;
  payBooking: (id: string, amount: number, full: boolean, metode: string) => Promise<void>;
}

const CartContext = createContext<CartContextShape | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>(dummyCategories);
  const [items, setItems] = useState<Item[]>(dummyItems);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = new Date();
  const plus3 = new Date();
  plus3.setDate(plus3.getDate() + 2);
  const [startDate, setStartDate] = useState<string>(toISODate(t));
  const [endDate, setEndDate] = useState<string>(toISODate(plus3));

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextCategories, nextItems, nextBookings] = await Promise.all([
        mobileApi.getCustomerCategories(),
        mobileApi.getCustomerItems({ limit: 100 }).then((result) => result.items),
        token
          ? mobileApi.getCustomerOrders("all", token).then((result) =>
              result.items.map((order): Booking => {
                const status: Booking["status"] =
                  order.status_display === "Selesai"
                    ? "Selesai"
                    : order.status_display === "Batal"
                      ? "Dibatalkan"
                      : order.status_display === "Aktif"
                        ? "Sedang Disewa"
                        : "Dikonfirmasi";

                return {
                  id: order.id,
                  kode: order.kode_rental,
                  tanggal_mulai: order.periode_mulai,
                  tanggal_kembali: order.periode_selesai,
                  items: [],
                  total: order.total_tagihan,
                  deposit: 0,
                  status,
                  paymentStatus: order.status_pembayaran,
                  terbayar: order.total_bayar,
                  catatan: "",
                  alamat: "",
                  createdAt: order.tanggal_order,
                };
              }),
            )
          : Promise.resolve([]),
      ]);
      setCategories(nextCategories);
      setItems(nextItems);
      setBookings(nextBookings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data backend");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getItem = useCallback(
    (itemId: string) =>
      items.find((item) => item.id === itemId || item.kode_barang === itemId) ||
      cart.find((line) => line.itemId === itemId || line.item?.kode_barang === itemId)?.item,
    [cart, items],
  );
  const getCategory = useCallback((categoryId: string) => categories.find((cat) => cat.id === categoryId), [categories]);

  const cartDays = useMemo(() => rentalDays(startDate, endDate), [startDate, endDate]);

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const item = getItem(line.itemId);
        return sum + (item ? item.harga_sewa_per_hari * line.qty * cartDays : 0);
      }, 0),
    [cart, cartDays, getItem],
  );

  const cartDeposit = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const item = getItem(line.itemId);
        return sum + (item ? item.deposit_default * line.qty : 0);
      }, 0),
    [cart, getItem],
  );

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  function addToCart(itemOrId: string | Item, qty = 1) {
    const item = typeof itemOrId === "string" ? getItem(itemOrId) : itemOrId;
    const itemId = typeof itemOrId === "string" ? itemOrId : itemOrId.id;

    setCart((prev) => {
      const existing = prev.find((line) => line.itemId === itemId);
      if (existing) {
        return prev.map((line) =>
          line.itemId === itemId ? { ...line, qty: line.qty + qty, item: line.item || item } : line
        );
      }
      return [...prev, { itemId, qty, item }];
    });
  }

  function setQty(itemId: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((line) => line.itemId !== itemId)
        : prev.map((line) => (line.itemId === itemId ? { ...line, qty } : line)),
    );
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((line) => line.itemId !== itemId));
  }

  function clearCart() {
    setCart([]);
  }

  async function createBooking(info: { catatan: string; alamat: string }): Promise<Booking> {
    if (!token) throw new Error("Login customer dibutuhkan");

    const detail = cart
      .map((line) => {
        const item = getItem(line.itemId) || line.item;
        return item ? { item, qty: line.qty } : null;
      })
      .filter((line): line is { item: Item; qty: number } => Boolean(line));

    if (detail.length === 0) {
      throw new Error("Keranjang kosong atau data barang belum termuat. Buka keranjang lalu coba checkout lagi.");
    }

    const booking = await mobileApi.createCheckout({
      token,
      tanggal_mulai: startDate,
      tanggal_kembali: endDate,
      catatan: info.catatan,
      alamat: info.alamat,
      detail,
    });

    setBookings((prev) => [booking, ...prev.filter((item) => item.id !== booking.id)]);
    setCart([]);
    await refreshData();
    return booking;
  }

  async function payBooking(id: string, amount: number, full: boolean, metode: string) {
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;

    await mobileApi.createPayment({
      kode_rental: booking.kode,
      amount,
      tipe: full ? "pelunasan" : "dp",
      metode,
    });

    setBookings((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const terbayar = item.terbayar + amount;
        return {
          ...item,
          terbayar,
          paymentStatus: full || terbayar >= item.total ? "Lunas" : "DP",
        };
      }),
    );
    await refreshData();
  }

  const value: CartContextShape = {
    categories,
    items,
    bookings,
    loading,
    error,
    apiUrl: API_URL,
    cart,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    refreshData,
    getItem,
    getCategory,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    cartCount,
    cartDays,
    cartSubtotal,
    cartDeposit,
    createBooking,
    payBooking,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
