import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import { formatRupiah, formatDate, toISODate } from "@/lib/format";
import { Button, Stepper } from "@/components/Button";
import { Card, Row } from "@/components/Card";
import { useCart } from "@/store/CartContext";

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export default function Keranjang() {
  const insets = useSafeAreaInsets();
  const {
    cart,
    setQty,
    removeFromCart,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    cartDays,
    cartSubtotal,
    getItem,
  } = useCart();

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text, paddingHorizontal: 20 }}>Keranjang</Text>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
          <Text style={{ fontSize: 56 }}>🛒</Text>
          <Text style={{ fontWeight: "800", fontSize: 17, color: colors.text }}>Keranjang masih kosong</Text>
          <Text style={{ color: colors.textMuted, textAlign: "center" }}>Yuk jelajahi katalog dan tambahkan barang yang ingin disewa.</Text>
          <Button label="Lihat Katalog" onPress={() => router.push("/katalog")} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text, paddingHorizontal: 20, marginBottom: 12 }}>Keranjang</Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 12 }}>📅 Periode Sewa</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <DateBox label="Mulai" value={startDate} onMinus={() => setStartDate(shiftDate(startDate, -1))} onPlus={() => setStartDate(shiftDate(startDate, 1))} />
            <DateBox label="Kembali" value={endDate} onMinus={() => setEndDate(shiftDate(endDate, -1))} onPlus={() => setEndDate(shiftDate(endDate, 1))} />
          </View>
          <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: 10, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="time" size={16} color={colors.primaryDark} />
            <Text style={{ color: colors.primaryDark, fontWeight: "700", fontSize: 13 }}>Total durasi sewa: {cartDays} hari</Text>
          </View>
        </Card>

        {cart.map((line) => {
          const it = getItem(line.itemId);
          if (!it) return null;
          return (
            <View
              key={line.itemId}
              style={{ flexDirection: "row", backgroundColor: colors.card, borderRadius: radius.lg, padding: 12, marginBottom: 12, gap: 12, alignItems: "center", ...shadow.soft }}
            >
              <View style={{ width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 30 }}>{it.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={1} style={{ fontWeight: "800", color: colors.text }}>{it.nama_barang}</Text>
                <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>{formatRupiah(it.harga_sewa_per_hari)}/hari</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <Stepper value={line.qty} onChange={(v) => setQty(line.itemId, v)} />
                  <Pressable onPress={() => removeFromCart(line.itemId)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <Card style={{ marginTop: 4 }}>
          <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 8 }}>Ringkasan</Text>
          <Row label={`Subtotal sewa (${cartDays} hari)`} value={formatRupiah(cartSubtotal)} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <Row label="Total sewa" value={formatRupiah(cartSubtotal)} bold valueColor={colors.primary} />
          <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 6 }}>* Jaminan/deposit dicatat admin saat serah terima keluar.</Text>
        </Card>
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
          ...shadow.card,
        }}
      >
        <Button
          label={`Lanjut ke Checkout · ${formatRupiah(cartSubtotal)}`}
          onPress={() => router.push("/checkout")}
          icon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
        />
      </View>
    </View>
  );
}

function DateBox({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10 }}>
      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 13, marginVertical: 6 }}>{formatDate(value)}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Pressable onPress={onMinus} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="remove" size={16} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onPlus} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={16} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}
