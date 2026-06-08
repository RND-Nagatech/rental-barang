import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button, IconButton } from "@/components/Button";
import { Card, Row } from "@/components/Card";
import { PayStatusBadge } from "@/components/Badge";
import { useCart } from "@/store/CartContext";

const methods = [
  { id: "transfer", nama: "Transfer Bank", sub: "BCA, Mandiri, BNI", icon: "card-outline" as const },
  { id: "qris", nama: "QRIS", sub: "Scan & bayar instan", icon: "qr-code-outline" as const },
  { id: "ewallet", nama: "E-Wallet", sub: "GoPay, OVO, DANA", icon: "wallet-outline" as const },
  { id: "cod", nama: "Bayar di Toko", sub: "Tunai saat ambil barang", icon: "storefront-outline" as const },
];

export default function Pembayaran() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, payBooking } = useCart();
  const booking = bookings.find((b) => b.id === id);
  const [method, setMethod] = useState("transfer");
  const [scheme, setScheme] = useState<"dp" | "full">("dp");
  const [paid, setPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!booking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.textMuted }}>Pesanan tidak ditemukan.</Text>
      </View>
    );
  }

  const grandTotal = booking.total;
  const sisa = Math.max(0, grandTotal - booking.terbayar);
  const dpAmount = Math.round(booking.total * 0.5);
  const payAmount = Math.min(sisa, scheme === "dp" ? dpAmount : sisa);

  async function handlePay() {
    if (payAmount <= 0) {
      Alert.alert("Sudah lunas", "Tidak ada sisa tagihan untuk pesanan ini.");
      return;
    }

    setSubmitting(true);
    try {
      await payBooking(booking!.id, payAmount, scheme === "full", method);
      setPaid(true);
    } catch (error) {
      Alert.alert("Pembayaran gagal", error instanceof Error ? error.message : "Coba lagi beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  }

  if (paid) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="checkmark-circle" size={72} color={colors.white} />
          </View>
          <Text style={{ color: colors.white, fontSize: 24, fontWeight: "900" }}>Pembayaran Berhasil!</Text>
          <Text style={{ color: colors.primaryLight, textAlign: "center", fontSize: 15 }}>
            {scheme === "dp" ? "DP kamu telah kami terima." : "Pesanan kamu sudah lunas."} Pesanan {booking.kode} sedang diproses.
          </Text>
          <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.md, padding: 16, width: "100%", marginTop: 8 }}>
            <RowLight label="Dibayar" value={formatRupiah(payAmount)} />
            <RowLight label="Metode" value={methods.find((m) => m.id === method)?.nama ?? "-"} />
            <RowLight label="Status" value={scheme === "full" ? "Lunas" : "DP"} />
          </View>
          <View style={{ width: "100%", gap: 10, marginTop: 12 }}>
            <Button label="Lihat Pesanan Saya" variant="soft" full onPress={() => router.replace("/transaksi")} />
            <Pressable onPress={() => router.replace("/")}>
              <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", paddingVertical: 8 }}>Kembali ke Beranda</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconButton onPress={() => router.back()} bg={colors.card}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>Pembayaran</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontWeight: "900", color: colors.text }}>{booking.kode}</Text>
            <PayStatusBadge status={booking.paymentStatus} />
          </View>
          <Row label="Periode" value={`${formatDate(booking.tanggal_mulai)} - ${formatDate(booking.tanggal_kembali)}`} />
          <Row label="Subtotal sewa" value={formatRupiah(booking.total)} />
          <Row label="Sudah dibayar" value={formatRupiah(booking.terbayar)} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <Row label="Total tagihan" value={formatRupiah(grandTotal)} bold valueColor={colors.primary} />
        </Card>

        <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 10 }}>Pilih Skema Pembayaran</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <SchemeCard active={scheme === "dp"} onPress={() => setScheme("dp")} title="DP 50%" amount={dpAmount} note="Bayar sebagian" />
          <SchemeCard active={scheme === "full"} onPress={() => setScheme("full")} title="Bayar Lunas" amount={sisa} note="Sekaligus" />
        </View>

        <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 10 }}>Metode Pembayaran</Text>
        <View style={{ gap: 10 }}>
          {methods.map((m) => {
            const on = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: on ? colors.primary : colors.border,
                }}
              >
                <View style={{ width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={m.icon} size={22} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "800", color: colors.text }}>{m.nama}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.sub}</Text>
                </View>
                <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={22} color={on ? colors.primary : colors.textFaint} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.card,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: insets.bottom + 14,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          ...shadow.card,
        }}
      >
        <View>
          <Text style={{ color: colors.textFaint, fontSize: 11 }}>Bayar sekarang</Text>
          <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 18 }}>{formatRupiah(payAmount)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={submitting ? "Mencatat Pembayaran..." : "Bayar Sekarang"}
            disabled={submitting || payAmount <= 0}
            onPress={handlePay}
            icon={<Ionicons name="lock-closed" size={16} color={colors.white} />}
          />
        </View>
      </View>
    </View>
  );
}

function SchemeCard({ active, onPress, title, amount, note }: { active: boolean; onPress: () => void; title: string; amount: number; note: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? colors.primary : colors.card,
        borderRadius: radius.md,
        padding: 14,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontWeight: "900", color: active ? colors.white : colors.text }}>{title}</Text>
      <Text style={{ fontWeight: "900", fontSize: 16, color: active ? colors.white : colors.primary, marginVertical: 4 }}>{formatRupiah(amount)}</Text>
      <Text style={{ fontSize: 11, color: active ? colors.primaryLight : colors.textMuted }}>{note}</Text>
    </Pressable>
  );
}

function RowLight({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ color: colors.primaryLight, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>{value}</Text>
    </View>
  );
}
