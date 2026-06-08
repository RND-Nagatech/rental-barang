import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ReceiptText,
  PackageCheck,
  ArrowUpFromLine,
  Clock,
  ArrowDownToLine,
  Wallet,
  CalendarDays,
  BarChart3,
  Settings,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Utama",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Master Data",
    items: [
      { title: "Kategori", url: "/kategori", icon: Tags },
      { title: "Barang", url: "/barang", icon: Package },
      { title: "Customer", url: "/customer", icon: Users },
    ],
  },
  {
    label: "Operasional Rental",
    items: [
      { title: "Transaksi Rental", url: "/transaksi", icon: ReceiptText },
      { title: "Siap Keluar", url: "/siap-keluar", icon: PackageCheck },
      { title: "Serah Terima Keluar", url: "/serah-terima-keluar", icon: ArrowUpFromLine },
      { title: "Sedang Disewa", url: "/sedang-disewa", icon: Clock },
      { title: "Serah Terima Kembali", url: "/serah-terima-kembali", icon: ArrowDownToLine },
    ],
  },
  {
    label: "Keuangan & Lainnya",
    items: [
      { title: "Pembayaran", url: "/pembayaran", icon: Wallet },
      { title: "Kalender Ketersediaan", url: "/kalender", icon: CalendarDays },
      { title: "Laporan", url: "/laporan", icon: BarChart3 },
      { title: "Pengaturan", url: "/pengaturan", icon: Settings },
      { title: "Manage User", url: "/manage-user", icon: UserCog },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
