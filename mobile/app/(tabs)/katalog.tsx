import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/theme";
import { ItemCard } from "@/components/ItemCard";
import type { Category, Item } from "@/data/types";
import { mobileApi } from "@/lib/api";

export default function Katalog() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kategori?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(params.kategori ?? "all");

  const loadCategories = useCallback(async () => {
    const result = await mobileApi.getCustomerCategories();
    setCategories(result);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await mobileApi.getCustomerItems({
        q: query.trim(),
        kode_kategori: active === "all" ? "" : active,
        limit: 50,
      });
      setItems(result.items);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    } finally {
      setLoading(false);
    }
  }, [active, query]);

  const refreshData = useCallback(async () => {
    try {
      await loadCategories();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
      setLoading(false);
    }
  }, [loadCategories, loadItems]);

  useEffect(() => {
    loadCategories().catch((err) => {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    });
  }, [loadCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadItems]);

  const chips: Category[] = [
    { id: "all", kode: "all", nama: "Semua", deskripsi: "", emoji: "✨" },
    ...categories,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>Katalog Barang</Text>
        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
          {loading ? "Memuat data backend..." : `${total} barang tersedia`}
        </Text>
        {error && (
          <Pressable onPress={refreshData} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "700" }}>Backend belum tersambung. Tap untuk coba lagi.</Text>
          </Pressable>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            height: 50,
            gap: 10,
            marginTop: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari barang..."
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, fontSize: 14, color: colors.text }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}
      >
        {chips.map((c) => {
          const on = active === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setActive(c.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                height: 38,
                borderRadius: radius.full,
                backgroundColor: on ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: on ? colors.primary : colors.border,
              }}
            >
              {c.iconUrl ? (
                <Image source={{ uri: c.iconUrl }} style={{ width: 18, height: 18, borderRadius: 5 }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
              )}
              <Text style={{ fontWeight: "700", fontSize: 13, color: on ? colors.white : colors.textMuted }}>{c.nama}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
            <Text style={{ fontSize: 44 }}>🔍</Text>
            <Text style={{ color: colors.textMuted, fontWeight: "600" }}>Barang tidak ditemukan</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
            {items.map((it) => (
              <ItemCard key={it.id} item={it} width="47%" />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
