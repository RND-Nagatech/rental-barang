import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Item } from "@/data/types";

const PREFS_KEY = "rentory_customer_preferences";
const memoryStorage: Record<string, string | null> = {};

type Address = {
  id: string;
  label: string;
  alamat: string;
  is_default: boolean;
};

type PaymentMethod = {
  id: string;
  nama: string;
  tipe: "Transfer Bank" | "E-Wallet" | "QRIS" | "Tunai";
  keterangan: string;
};

type NotificationPrefs = {
  pesanan: boolean;
  pembayaran: boolean;
  promo: boolean;
};

type StoredPrefs = {
  favorites: Item[];
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  notifications: NotificationPrefs;
};

type CustomerPrefsContextShape = StoredPrefs & {
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (item: Item) => void;
  removeFavorite: (itemId: string) => void;
  saveAddress: (address: Omit<Address, "id"> & { id?: string }) => void;
  removeAddress: (id: string) => void;
  savePaymentMethod: (method: Omit<PaymentMethod, "id"> & { id?: string }) => void;
  removePaymentMethod: (id: string) => void;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
};

const defaultPrefs: StoredPrefs = {
  favorites: [],
  addresses: [],
  paymentMethods: [],
  notifications: {
    pesanan: true,
    pembayaran: true,
    promo: false,
  },
};

const safeStorage = {
  async getItem(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      memoryStorage[key] = value;
      return value;
    } catch {
      return memoryStorage[key] || null;
    }
  },
  async setItem(key: string, value: string) {
    memoryStorage[key] = value;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Expo Go may miss the native storage module. In-memory is enough for the current session.
    }
  },
};

const CustomerPrefsContext = createContext<CustomerPrefsContextShape | null>(null);

export function CustomerPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<StoredPrefs>(defaultPrefs);

  useEffect(() => {
    let mounted = true;

    async function loadPrefs() {
      const raw = await safeStorage.getItem(PREFS_KEY);
      if (!mounted || !raw) return;
      try {
        setPrefs({ ...defaultPrefs, ...(JSON.parse(raw) as Partial<StoredPrefs>) });
      } catch {
        setPrefs(defaultPrefs);
      }
    }

    loadPrefs();
    return () => {
      mounted = false;
    };
  }, []);

  const updatePrefs = useCallback((updater: (current: StoredPrefs) => StoredPrefs) => {
    setPrefs((current) => {
      const next = updater(current);
      safeStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (itemId: string) => prefs.favorites.some((item) => item.id === itemId || item.kode_barang === itemId),
    [prefs.favorites],
  );

  const toggleFavorite = useCallback(
    (item: Item) => {
      updatePrefs((current) => {
        const exists = current.favorites.some((favorite) => favorite.id === item.id || favorite.kode_barang === item.kode_barang);
        return {
          ...current,
          favorites: exists
            ? current.favorites.filter((favorite) => favorite.id !== item.id && favorite.kode_barang !== item.kode_barang)
            : [item, ...current.favorites],
        };
      });
    },
    [updatePrefs],
  );

  const removeFavorite = useCallback(
    (itemId: string) => {
      updatePrefs((current) => ({
        ...current,
        favorites: current.favorites.filter((item) => item.id !== itemId && item.kode_barang !== itemId),
      }));
    },
    [updatePrefs],
  );

  const saveAddress = useCallback(
    (address: Omit<Address, "id"> & { id?: string }) => {
      updatePrefs((current) => {
        const id = address.id || `addr-${Date.now()}`;
        const nextAddress = { ...address, id };
        const addresses = current.addresses.some((item) => item.id === id)
          ? current.addresses.map((item) => (item.id === id ? nextAddress : item))
          : [nextAddress, ...current.addresses];
        return {
          ...current,
          addresses: nextAddress.is_default
            ? addresses.map((item) => ({ ...item, is_default: item.id === id }))
            : addresses,
        };
      });
    },
    [updatePrefs],
  );

  const removeAddress = useCallback(
    (id: string) => updatePrefs((current) => ({ ...current, addresses: current.addresses.filter((item) => item.id !== id) })),
    [updatePrefs],
  );

  const savePaymentMethod = useCallback(
    (method: Omit<PaymentMethod, "id"> & { id?: string }) => {
      updatePrefs((current) => {
        const id = method.id || `pay-${Date.now()}`;
        const nextMethod = { ...method, id };
        return {
          ...current,
          paymentMethods: current.paymentMethods.some((item) => item.id === id)
            ? current.paymentMethods.map((item) => (item.id === id ? nextMethod : item))
            : [nextMethod, ...current.paymentMethods],
        };
      });
    },
    [updatePrefs],
  );

  const removePaymentMethod = useCallback(
    (id: string) => updatePrefs((current) => ({ ...current, paymentMethods: current.paymentMethods.filter((item) => item.id !== id) })),
    [updatePrefs],
  );

  const setNotification = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      updatePrefs((current) => ({
        ...current,
        notifications: { ...current.notifications, [key]: value },
      }));
    },
    [updatePrefs],
  );

  const value = useMemo(
    () => ({
      ...prefs,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      saveAddress,
      removeAddress,
      savePaymentMethod,
      removePaymentMethod,
      setNotification,
    }),
    [
      isFavorite,
      prefs,
      removeAddress,
      removeFavorite,
      removePaymentMethod,
      saveAddress,
      savePaymentMethod,
      setNotification,
      toggleFavorite,
    ],
  );

  return <CustomerPrefsContext.Provider value={value}>{children}</CustomerPrefsContext.Provider>;
}

export function useCustomerPrefs() {
  const ctx = useContext(CustomerPrefsContext);
  if (!ctx) throw new Error("useCustomerPrefs must be used within CustomerPrefsProvider");
  return ctx;
}
