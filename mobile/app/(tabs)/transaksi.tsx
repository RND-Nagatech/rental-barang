import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import { formatRupiah, formatDate } from "@/lib/format";
import { OrderStatusBadge, PayStatusBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import type { CustomerOrder, OrderFilter } from "@/data/types";
import { mobileApi } from "@/lib/api";
import { useAuth } from "@/store/AuthContext";

const filters: { label: "Semua" | "Aktif" | "Selesai"; value: OrderFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Selesai", value: "selesai" },
];

export default function Transaksi() {
  const insets = useSafeAreaInsets();
  const { token, isLoggedIn, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<OrderFilter>("active");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await mobileApi.getCustomerOrders(filter, token);
      setOrders(result.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  const cancelOrder = useCallback(
    (order: CustomerOrder) => {
      if (!token) return;

      Alert.alert(
        "Batalkan pesanan?",
        `Pesanan ${order.kode_rental} akan dibatalkan dan stok booking dilepas.`,
        [
          { text: "Tidak", style: "cancel" },
          {
            text: "Batalkan",
            style: "destructive",
            onPress: async () => {
              try {
                await mobileApi.cancelCustomerOrder(order.id, token);
                await loadOrders();
              } catch (err) {
                Alert.alert("Gagal membatalkan", err instanceof Error ? err.message : "Coba lagi beberapa saat.");
              }
            },
          },
        ],
      );
    },
    [loadOrders, token],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text, paddingHorizontal: 20 }}>Pesanan Saya</Text>
      {(loading || authLoading) && <Text style={{ color: colors.textMuted, fontSize: 12, paddingHorizontal: 20, marginTop: 4 }}>Memuat transaksi...</Text>}
      {!authLoading && !isLoggedIn && (
        <Pressable onPress={() => router.push({ pathname: "/login", params: { redirect: "/transaksi" } })} style={{ paddingHorizontal: 20, marginTop: 6 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>Login untuk melihat pesanan kamu.</Text>
        </Pressable>
      )}
      {error && (
        <Pressable onPress={loadOrders} style={{ paddingHorizontal: 20, marginTop: 6 }}>
          <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "800" }}>Backend belum tersambung. Tap untuk muat ulang.</Text>
        </Pressable>
      )}

      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: 14 }}>
        {filters.map((f) => {
          const on = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={{
                paddingHorizontal: 16,
                height: 36,
                borderRadius: radius.full,
                justifyContent: "center",
                backgroundColor: on ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: on ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 13, color: on ? colors.white : colors.textMuted }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {!authLoading && !isLoggedIn ? (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
            <Ionicons name="lock-closed-outline" size={52} color={colors.primary} />
            <Text style={{ fontWeight: "800", color: colors.text }}>Login dulu untuk melihat pesanan</Text>
            <Button label="Masuk / Daftar" onPress={() => router.push({ pathname: "/login", params: { redirect: "/transaksi" } })} style={{ marginTop: 6 }} />
          </View>
        ) : !loading && orders.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
            <Text style={{ fontSize: 52 }}>📋</Text>
            <Text style={{ fontWeight: "800", color: colors.text }}>Belum ada pesanan</Text>
            <Button label="Mulai Sewa" onPress={() => router.push("/katalog")} style={{ marginTop: 6 }} />
          </View>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} onCancel={cancelOrder} />)
        )}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, onCancel }: { order: CustomerOrder; onCancel: (order: CustomerOrder) => void }) {
  const canCancel = order.status_rental === "Booking" || order.status_rental === "Siap Keluar";

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow.soft }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <View>
          <Text style={{ fontWeight: "900", color: colors.text, fontSize: 15 }}>{order.kode_rental}</Text>
          <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 2 }}>{formatDate(order.tanggal_order)}</Text>
        </View>
        <OrderStatusBadge status={order.status_display} />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        {order.thumbnail_items.slice(0, 2).map((url, idx) => (
          <View
            key={`${url}-${idx}`}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: idx === 0 ? 0 : -10,
              borderWidth: 2,
              borderColor: colors.card,
            }}
          >
            <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
        ))}
        {order.thumbnail_items.length === 0 && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.card,
            }}
          >
            <Ionicons name="cube-outline" size={20} color={colors.primaryDark} />
          </View>
        )}
        <View style={{ justifyContent: "center", marginLeft: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>
            {order.jumlah_jenis_barang} jenis barang
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Periode</Text>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
            {formatDate(order.periode_mulai)} - {formatDate(order.periode_selesai)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Total</Text>
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "900" }}>{formatRupiah(order.total_tagihan)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
        <PayStatusBadge status={order.status_pembayaran} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
          {canCancel && (
            <Pressable
              onPress={() => onCancel(order)}
              style={{ backgroundColor: colors.dangerSoft, paddingHorizontal: 14, height: 38, borderRadius: radius.full, justifyContent: "center" }}
            >
              <Text style={{ color: colors.danger, fontWeight: "800", fontSize: 13 }}>Batal</Text>
            </Pressable>
          )}
          {order.sisa_tagihan > 0 && order.status_display !== "Batal" && (
            <Pressable
              onPress={() => router.push(`/pembayaran/${order.id}`)}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 16, height: 38, borderRadius: radius.full, justifyContent: "center" }}
            >
              <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>Bayar {formatRupiah(order.sisa_tagihan)}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
