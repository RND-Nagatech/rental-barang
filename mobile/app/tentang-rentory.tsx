import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "@/components/Button";
import { Card, Row } from "@/components/Card";
import { colors, radius } from "@/theme";
import { mobileApi } from "@/lib/api";

type AboutData = {
  app_name: string;
  nama_usaha: string;
  versi: string;
  alamat: string;
  telepon: string;
  deskripsi: string;
};

export default function TentangRentory() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AboutData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await mobileApi.getCustomerAbout();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend belum tersambung");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 34, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <IconButton onPress={() => router.back()} bg="rgba(255,255,255,0.18)">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </IconButton>
        <Text style={{ color: colors.white, fontSize: 28, fontWeight: "900", marginTop: 22 }}>{data?.app_name || "Rentory"}</Text>
        <Text style={{ color: colors.primaryLight, marginTop: 4, fontWeight: "700" }}>Versi {data?.versi || "1.0.0"}</Text>
      </LinearGradient>

      <View style={{ padding: 20, gap: 14 }}>
        {error && (
          <Pressable onPress={loadData} style={{ borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: 12 }}>
            <Text style={{ color: colors.danger, fontWeight: "800", fontSize: 12 }}>Backend belum tersambung. Tap untuk muat ulang.</Text>
          </Pressable>
        )}

        <Card>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 17 }}>{data?.nama_usaha || "Rentory Rental"}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 10, lineHeight: 22 }}>
            {data?.deskripsi || "Rentory membantu proses rental barang menjadi lebih mudah dan terpercaya."}
          </Text>
        </Card>

        <Card>
          <Row label="Telepon" value={data?.telepon || "-"} />
          <Row label="Alamat" value={data?.alamat || "-"} />
        </Card>
      </View>
    </ScrollView>
  );
}
