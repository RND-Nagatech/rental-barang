import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/theme";
import { ItemCard } from "@/components/ItemCard";
import { SectionTitle } from "@/components/Card";
import type { HomeData } from "@/data/types";
import { mobileApi } from "@/lib/api";

export default function Home() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [home, setHome] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const data = await mobileApi.getHome();
      setHome(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const categories = home?.categories || [];
  const popular = home?.popularItems || [];
  const fresh = home?.readyItems || [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 56, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: colors.primaryLight, fontSize: 13, fontWeight: "600" }}>Selamat datang 👋</Text>
            <Text style={{ color: colors.white, fontSize: 24, fontWeight: "900", marginTop: 2 }}>{home?.appName || "Rentory"}</Text>
          </View>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </View>
        </View>
        <Text style={{ color: colors.white, fontSize: 17, fontWeight: "700", marginTop: 18, lineHeight: 24 }}>
          {(home?.headline || "Sewa apa saja, kapan saja. Mudah & terpercaya.").replace(". ", ".\n")}
        </Text>
        {!!home?.subheadline && <Text style={{ color: colors.primaryLight, marginTop: 8 }}>{home.subheadline}</Text>}
      </LinearGradient>

      <View style={{ marginTop: -28, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.push("/katalog")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: radius.md,
            paddingHorizontal: 16,
            height: 54,
            gap: 10,
            ...shadow.card,
          }}
        >
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => router.push("/katalog")}
            placeholder="Cari barang..."
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, fontSize: 14, color: colors.text }}
          />
        </Pressable>
      </View>

      {error && (
        <Pressable onPress={refreshData} style={{ marginHorizontal: 20, marginTop: 12, backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 12 }}>
          <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "800" }}>Backend belum tersambung. Tap untuk muat ulang.</Text>
        </Pressable>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SectionTitle
          title="Kategori"
          action={
            <Pressable onPress={() => router.push("/katalog")}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Lihat semua</Text>
            </Pressable>
          }
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push({ pathname: "/katalog", params: { kategori: c.id } })}
            style={{ alignItems: "center", width: 78 }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.lg,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                ...shadow.soft,
              }}
            >
              {c.iconUrl ? (
                <Image source={{ uri: c.iconUrl }} style={{ width: 48, height: 48, borderRadius: radius.md }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 30 }}>{c.emoji}</Text>
              )}
            </View>
            <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: "700", color: colors.text, textAlign: "center", marginTop: 6 }}>
              {c.nama}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <SectionTitle title="🔥 Paling Populer" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
        {popular.map((it) => (
          <ItemCard key={it.id} item={it} width={160} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <SectionTitle
          title="Siap Disewa"
          action={
            <Pressable onPress={() => router.push("/katalog")}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Lihat semua</Text>
            </Pressable>
          }
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
          {fresh.map((it) => (
            <ItemCard key={it.id} item={it} width="47%" />
          ))}
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
