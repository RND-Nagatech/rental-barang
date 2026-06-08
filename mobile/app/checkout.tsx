import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button, IconButton } from "@/components/Button";
import { Card, Row } from "@/components/Card";
import { useCart } from "@/store/CartContext";
import { useAuth } from "@/store/AuthContext";

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { cart, startDate, endDate, cartDays, cartSubtotal, createBooking } = useCart();
  const { customer, isLoggedIn, loading: authLoading } = useAuth();
  const [alamat, setAlamat] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace({ pathname: "/login", params: { redirect: "/checkout" } });
    }
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    if (customer?.alamat_default && !alamat) {
      setAlamat(customer.alamat_default);
    }
  }, [alamat, customer?.alamat_default]);

  async function handleSubmit() {
    if (!isLoggedIn) {
      router.replace({ pathname: "/login", params: { redirect: "/checkout" } });
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({ catatan, alamat: alamat || "Ambil di toko" });
      router.replace(`/pembayaran/${booking.id}`);
    } catch (error) {
      Alert.alert("Gagal membuat pesanan", error instanceof Error ? error.message : "Coba lagi beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconButton onPress={() => router.back()} bg={colors.card}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 12 }}>Data Penyewa</Text>
          <Row label="Nama" value={customer?.nama_customer || "-"} />
          <Row label="No. telepon" value={customer?.no_hp || "-"} />
          <View style={{ height: 8 }} />
          <Field label="Alamat pengiriman (opsional)" value={alamat} onChangeText={setAlamat} placeholder="Kosongkan untuk ambil di toko" multiline />
          <Field label="Catatan (opsional)" value={catatan} onChangeText={setCatatan} placeholder="Contoh: untuk acara pernikahan" multiline />
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 8 }}>Periode Sewa</Text>
          <Row label="Mulai" value={formatDate(startDate)} />
          <Row label="Kembali" value={formatDate(endDate)} />
          <Row label="Durasi" value={`${cartDays} hari`} />
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 8 }}>Barang ({cart.length})</Text>
          {cart.map((l) => {
            return <CheckoutLine key={l.itemId} itemId={l.itemId} qty={l.qty} days={cartDays} />;
          })}
        </Card>

        <Card>
          <Text style={{ fontWeight: "900", color: colors.text, marginBottom: 8 }}>Ringkasan Pembayaran</Text>
          <Row label="Subtotal sewa" value={formatRupiah(cartSubtotal)} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <Row label="Total sewa" value={formatRupiah(cartSubtotal)} bold valueColor={colors.primary} />
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
          label={submitting ? "Membuat Pesanan..." : "Buat Pesanan"}
          disabled={submitting || authLoading || !isLoggedIn}
          onPress={handleSubmit}
          icon={<Ionicons name="checkmark-circle" size={18} color={colors.white} />}
        />
      </View>
    </View>
  );
}

function CheckoutLine({ itemId, qty, days }: { itemId: string; qty: number; days: number }) {
  const { getItem } = useCart();
  const it = getItem(itemId);
  if (!it) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 20 }}>{it.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontWeight: "700", color: colors.text, fontSize: 13 }}>{it.nama_barang}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{qty} x {days} hari</Text>
      </View>
      <Text style={{ fontWeight: "800", color: colors.text, fontSize: 13 }}>{formatRupiah(it.harga_sewa_per_hari * qty * days)}</Text>
    </View>
  );
}

function Field({
  label,
  multiline,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 14,
          color: colors.text,
          minHeight: multiline ? 60 : 48,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
