import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import type { CustomerProfile } from "@/data/types";
import { useAuth } from "@/store/AuthContext";

const menu: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  route?: "/edit-profil" | "/alamat-saya" | "/metode-pembayaran" | "/favorit" | "/notifikasi" | "/bantuan" | "/tentang-rentory";
  authRequired?: boolean;
}[] = [
  { icon: "person-outline", label: "Edit Profil", sub: "Ubah data diri", route: "/edit-profil" },
  { icon: "location-outline", label: "Alamat Saya", sub: "Kelola alamat pengiriman", route: "/alamat-saya" },
  { icon: "card-outline", label: "Metode Pembayaran", sub: "Kartu & e-wallet", route: "/metode-pembayaran" },
  { icon: "heart-outline", label: "Favorit", sub: "Barang yang kamu suka", route: "/favorit" },
  { icon: "notifications-outline", label: "Notifikasi", sub: "Atur pemberitahuan", route: "/notifikasi" },
  { icon: "help-circle-outline", label: "Bantuan", sub: "FAQ & customer service", route: "/bantuan", authRequired: false },
  { icon: "information-circle-outline", label: "Tentang Rentory", sub: "Versi 1.0.0", route: "/tentang-rentory", authRequired: false },
];

export default function Profil() {
  const insets = useSafeAreaInsets();
  const { token, customer: sessionCustomer, loading: authLoading, isLoggedIn, logout, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await refreshProfile();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const customer = profile?.customer || sessionCustomer;
  const summary = profile?.summary;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ paddingTop: insets.top + 20, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {customer?.foto_profile ? (
              <Image source={{ uri: customer.foto_profile }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 30 }}>🧑</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.white, fontSize: 20, fontWeight: "900" }}>
              {customer?.nama_customer || (loading || authLoading ? "Memuat..." : "Customer")}
            </Text>
            <Text style={{ color: colors.primaryLight, fontSize: 13, marginTop: 2 }}>
              {customer?.email || customer?.no_hp || customer?.kode_customer || "-"}
            </Text>
          </View>
          <Ionicons name="create-outline" size={22} color={colors.white} />
        </View>

        {!authLoading && !isLoggedIn && (
          <Pressable onPress={() => router.push({ pathname: "/login", params: { redirect: "/profil" } })} style={{ marginTop: 14, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.16)", padding: 12 }}>
            <Text style={{ color: colors.white, fontWeight: "800", fontSize: 12 }}>Login untuk melihat profil kamu.</Text>
          </Pressable>
        )}

        {error && isLoggedIn && (
          <Pressable onPress={loadProfile} style={{ marginTop: 14, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.16)", padding: 12 }}>
            <Text style={{ color: colors.white, fontWeight: "800", fontSize: 12 }}>Backend belum tersambung. Tap untuk muat ulang.</Text>
          </Pressable>
        )}

        <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.lg, padding: 14, marginTop: 20 }}>
          <Stat label="Total" value={summary?.total_pesanan || 0} />
          <Divider />
          <Stat label="Aktif" value={summary?.pesanan_aktif || 0} />
          <Divider />
          <Stat label="Selesai" value={summary?.pesanan_selesai || 0} />
        </View>
      </LinearGradient>

      <View style={{ padding: 20, gap: 10 }}>
        {menu.map((m) => (
          <Pressable
            key={m.label}
            onPress={() => {
              if (!m.route) return;
              if (m.authRequired !== false && !isLoggedIn) {
                router.push({ pathname: "/login", params: { redirect: "/profil" } });
                return;
              }
              router.push(m.route);
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, ...shadow.soft }}
          >
            <View style={{ width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={m.icon} size={20} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: colors.text }}>{m.label}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Pressable>
        ))}

        <Pressable
          onPress={async () => {
            await logout();
            router.replace("/");
          }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 16, marginTop: 6 }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: "800" }}>Keluar</Text>
        </Pressable>
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ color: colors.white, fontSize: 20, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: colors.primaryLight, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
function Divider() {
  return <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />;
}
