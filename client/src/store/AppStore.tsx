import * as React from "react";
import {
  barangApi,
  customerApi,
  kategoriApi,
  mapPayment,
  mapRental,
  pembayaranApi,
  rentalApi,
} from "@/lib/api";
import type {
  Category,
  Customer,
  Item,
  Payment,
  Transaction,
  TransactionStatus,
} from "@/data/types";

interface StoreShape {
  categories: Category[];
  items: Item[];
  customers: Customer[];
  transactions: Transaction[];
  payments: Payment[];
  loading: boolean;
  // helpers
  getCustomer: (id: string) => Customer | undefined;
  getItem: (id: string) => Item | undefined;
  getCategory: (id: string) => Category | undefined;
  // mutations
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (c: Category) => void;
  addItem: (i: Omit<Item, "id" | "riwayat">) => void;
  updateItem: (i: Item) => void;
  addCustomer: (c: Omit<Customer, "id" | "totalTransaksi">) => void;
  updateCustomer: (c: Customer) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (t: Transaction) => void;
  setTransactionStatus: (id: string, status: TransactionStatus) => void;
  addPayment: (p: Omit<Payment, "id">) => void;
}

const StoreContext = React.createContext<StoreShape | null>(null);

const hitungTotalTransaksi = (customers: Customer[], transactions: Transaction[]) =>
  customers.map((customer) => ({
    ...customer,
    totalTransaksi: transactions.filter((transaction) => transaction.customerId === customer.id)
      .length,
  }));

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);

    try {
      const [categoryList, itemList, customerRaw] = await Promise.all([
        kategoriApi.list(),
        barangApi.list(),
        customerApi.list(),
      ]);

      setCategories(categoryList);
      setItems(itemList);
      setCustomers(customerRaw);

      const rentalRaw = await rentalApi.listRaw();
      const mappedTransactions = rentalRaw.map((rental) =>
        mapRental(rental, customerRaw, itemList),
      );

      const paymentRaw = await pembayaranApi.listRaw();
      const mappedPayments = paymentRaw.map((payment) => mapPayment(payment, mappedTransactions));

      setTransactions(mappedTransactions);
      setCustomers(hitungTotalTransaksi(customerRaw, mappedTransactions));
      setPayments(mappedPayments);
    } catch (error) {
      console.error("Gagal memuat data backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const value = React.useMemo<StoreShape>(
    () => ({
      categories,
      items,
      customers,
      transactions,
      payments,
      loading,
      getCustomer: (id) => customers.find((c) => c.id === id),
      getItem: (id) => items.find((i) => i.id === id),
      getCategory: (id) => categories.find((c) => c.id === id),
      addCategory: async (c) => {
        const created = await kategoriApi.create(c);
        setCategories((prev) => [created, ...prev]);
      },
      updateCategory: async (c) => {
        const updated = await kategoriApi.update(c);
        setCategories((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      },
      addItem: async (i) => {
        const created = await barangApi.create(i);
        setItems((prev) => [created, ...prev]);
      },
      updateItem: async (i) => {
        const updated = await barangApi.update(i);
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      },
      addCustomer: async (c) => {
        const created = await customerApi.create(c);
        setCustomers((prev) => [{ ...created, totalTransaksi: 0 }, ...prev]);
      },
      updateCustomer: async (c) => {
        const updated = await customerApi.update(c);
        setCustomers((prev) =>
          prev.map((x) =>
            x.id === updated.id ? { ...updated, totalTransaksi: x.totalTransaksi } : x,
          ),
        );
      },
      addTransaction: async (t) => {
        const createdRaw = await rentalApi.create(t, customers, items);
        const created = mapRental(createdRaw, customers, items);
        setTransactions((prev) => [created, ...prev]);
        setCustomers((prev) => hitungTotalTransaksi(prev, [created, ...transactions]));

        const [itemList, paymentRaw] = await Promise.all([
          barangApi.list(),
          pembayaranApi.listRaw(),
        ]);
        setItems(itemList);
        setPayments(paymentRaw.map((payment) => mapPayment(payment, [created, ...transactions])));
      },
      updateTransaction: async (t) => {
        const transaksiSaatIni = transactions.find((item) => item.id === t.id);
        const butuhTutupBerurutan =
          transaksiSaatIni?.status === "Sedang Disewa" && t.status === "Selesai";

        const updatedRaw = butuhTutupBerurutan
          ? await rentalApi.update(
              {
                ...t,
                status: "Serah Terima Kembali",
              },
              customers,
              items,
            )
          : await rentalApi.update(t, customers, items);

        const finalRaw = butuhTutupBerurutan
          ? await rentalApi.setStatus(t.id, "Selesai")
          : updatedRaw;
        const updated = mapRental(finalRaw, customers, items);
        setTransactions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

        const itemList = await barangApi.list();
        setItems(itemList);
      },
      setTransactionStatus: async (id, status) => {
        const updatedRaw = await rentalApi.setStatus(id, status);
        const updated = mapRental(updatedRaw, customers, items);
        setTransactions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

        const itemList = await barangApi.list();
        setItems(itemList);
      },
      addPayment: async (p) => {
        const createdRaw = await pembayaranApi.create(p, transactions);
        const created = mapPayment(createdRaw, transactions);
        setPayments((prev) => [created, ...prev]);

        const rentalRaw = await rentalApi.listRaw();
        const mappedTransactions = rentalRaw.map((rental) => mapRental(rental, customers, items));
        setTransactions(mappedTransactions);
      },
    }),
    [categories, items, customers, transactions, payments, loading],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within AppStoreProvider");
  return ctx;
}
