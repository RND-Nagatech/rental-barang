import React from "react";
import { Image, Pressable, Text, View, type DimensionValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, shadow } from "@/theme";
import { formatRupiah } from "@/lib/format";
import { ItemStatusBadge } from "./Badge";
import type { Item } from "@/data/types";

export function ItemCard({ item, width }: { item: Item; width?: DimensionValue }) {
  return (
    <Pressable
      onPress={() => router.push(`/barang/${item.id}`)}
      style={({ pressed }) => [
        {
          width,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          overflow: "hidden",
          ...shadow.soft,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View
        style={{
          height: 110,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 52 }}>{item.emoji}</Text>
        )}
        <View style={{ position: "absolute", top: 10, right: 10 }}>
          <ItemStatusBadge status={item.status} />
        </View>
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <Text numberOfLines={2} style={{ fontWeight: "800", color: colors.text, fontSize: 14, minHeight: 38 }}>
          {item.nama_barang}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="star" size={12} color={colors.accent} />
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600" }}>
            {item.rating.toFixed(1)} · {item.totalDisewa}x disewa
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 15 }}>
              {formatRupiah(item.harga_sewa_per_hari)}
            </Text>
            <Text style={{ color: colors.textFaint, fontSize: 10 }}>/ {item.satuan || "unit"} / hari</Text>
          </View>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={18} color={colors.white} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
