import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/Button";
import { ItemCard } from "@/components/ItemCard";
import { colors } from "@/theme";
import { useCustomerPrefs } from "@/store/CustomerPrefsContext";

export default function Favorit() {
  const insets = useSafeAreaInsets();
  const { favorites } = useCustomerPrefs();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14 }}>
        <IconButton onPress={() => router.back()} bg={colors.card}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </IconButton>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>Favorit</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {favorites.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 70, gap: 10 }}>
            <Ionicons name="heart-outline" size={54} color={colors.primary} />
            <Text style={{ color: colors.text, fontWeight: "900" }}>Belum ada favorit</Text>
            <Pressable onPress={() => router.push("/katalog")}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>Cari barang sekarang</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
            {favorites.map((item) => (
              <ItemCard key={item.id} item={item} width="47%" />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
