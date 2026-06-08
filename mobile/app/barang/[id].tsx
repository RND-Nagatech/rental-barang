import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import { formatRupiah } from "@/lib/format";
import { ItemStatusBadge } from "@/components/Badge";
import { Button, IconButton, Stepper } from "@/components/Button";
import { Card, Row } from "@/components/Card";
import { useCart } from "@/store/CartContext";
import { useCustomerPrefs } from "@/store/CustomerPrefsContext";

export default function BarangDetail() {
  const insets = useSafeAreaInsets();
  const { id, imageUrl, emoji } = useLocalSearchParams<{ id: string; imageUrl?: string; emoji?: string }>();
  const { addToCart, cartDays, getCategory, getItem } = useCart();
  const { isFavorite, toggleFavorite } = useCustomerPrefs();
  const item = getItem(id ?? "");
  const [qty, setQty] = useState(1);

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.textMuted }}>Barang tidak ditemukan.</Text>
      </View>
    );
  }

  const cat = getCategory(item.kategoriId);
  const soldOut = item.status === "Habis";
  const favorite = isFavorite(item.id);
  const displayImage = item.imageUrl || imageUrl || "";
  const displayEmoji = item.emoji || emoji || "📦";

  function handleAdd() {
    addToCart(item!, qty);
    router.push("/keranjang");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[colors.primarySoft, colors.background]} style={{ paddingTop: insets.top + 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 }}>
            <IconButton onPress={() => router.back()} bg={colors.card}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </IconButton>
            <IconButton onPress={() => toggleFavorite(item)} bg={favorite ? colors.dangerSoft : colors.card}>
              <Ionicons name={favorite ? "heart" : "heart-outline"} size={20} color={favorite ? colors.danger : colors.text} />
            </IconButton>
          </View>
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            {displayImage ? (
              <Image
                source={{ uri: displayImage }}
                style={{ width: 220, height: 220, borderRadius: radius.lg }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 120 }}>{displayEmoji}</Text>
            )}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -8, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "600" }}>
                {cat?.emoji} {cat?.nama}
              </Text>
            </View>
            <ItemStatusBadge status={item.status} />
          </View>

          <Text style={{ fontSize: 23, fontWeight: "900", color: colors.text, lineHeight: 30 }}>{item.nama_barang}</Text>

          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="star" size={15} color={colors.accent} />
              <Text style={{ fontWeight: "800", color: colors.text }}>{item.rating.toFixed(1)}</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontWeight: "600" }}>{item.totalDisewa}x disewa</Text>
            <Text style={{ color: colors.textMuted, fontWeight: "600" }}>Stok: {item.stok_tersedia} {item.satuan || "unit"}</Text>
          </View>

          <View>
            <Text style={{ fontWeight: "900", fontSize: 16, color: colors.text, marginBottom: 6 }}>Deskripsi</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{item.deskripsi}</Text>
          </View>

          <Card>
            <Row label="Harga sewa" value={`${formatRupiah(item.harga_sewa_per_hari)} / hari`} bold valueColor={colors.primary} />
            <Row label="Satuan" value={item.satuan || "unit"} />
            <Row label="Kode barang" value={item.kode_barang} />
          </Card>

          {!soldOut && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "800", color: colors.text }}>Jumlah</Text>
              <Stepper value={qty} onChange={(v) => setQty(Math.max(1, Math.min(item.stok_tersedia, v)))} />
            </View>
          )}
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
          <Text style={{ color: colors.textFaint, fontSize: 11 }}>Estimasi ({cartDays} hari)</Text>
          <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 18 }}>
            {formatRupiah(item.harga_sewa_per_hari * qty * cartDays)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={soldOut ? "Stok Habis" : "Tambah ke Keranjang"}
            disabled={soldOut}
            onPress={handleAdd}
            icon={<Ionicons name="cart" size={18} color={colors.white} />}
          />
        </View>
      </View>
    </View>
  );
}
