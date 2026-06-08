import React from "react";
import { Text, View } from "react-native";
import { colors, radius } from "@/theme";
import type { ItemStatus, OrderDisplayStatus, PaymentStatus, TransactionStatus } from "@/data/types";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "muted" | "accent";

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primaryDark },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
  accent: { bg: colors.accentSoft, fg: colors.warning },
  muted: { bg: colors.surface, fg: colors.textMuted },
};

export function Badge({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const t = toneMap[tone];
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <Text style={{ color: t.fg, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

const itemTone: Record<ItemStatus, Tone> = {
  Tersedia: "success",
  "Sebagian Disewa": "warning",
  "Tidak Tersedia": "danger",
  Habis: "danger",
  Maintenance: "muted",
};
export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return <Badge label={status} tone={itemTone[status]} />;
}

const trxTone: Record<TransactionStatus, Tone> = {
  "Menunggu Konfirmasi": "warning",
  Dikonfirmasi: "info",
  "Sedang Disewa": "primary",
  Selesai: "success",
  Dibatalkan: "danger",
};
export function TrxStatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge label={status} tone={trxTone[status]} />;
}

const orderTone: Record<OrderDisplayStatus, Tone> = {
  Dikonfirmasi: "info",
  Disiapkan: "warning",
  Aktif: "primary",
  "Proses Kembali": "warning",
  Selesai: "success",
  Batal: "danger",
};
export function OrderStatusBadge({ status }: { status: OrderDisplayStatus }) {
  return <Badge label={status} tone={orderTone[status]} />;
}

const payTone: Record<PaymentStatus, Tone> = {
  "Belum Bayar": "danger",
  DP: "warning",
  Lunas: "success",
};
export function PayStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge label={status} tone={payTone[status]} />;
}
